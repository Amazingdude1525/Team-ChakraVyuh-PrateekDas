import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Check, X, Sparkles } from 'lucide-react';
import { askAI } from '../../lib/ai';
import type { MenuItem } from '../../lib/types';
import { useCart } from '../../contexts/CartContext';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

interface VoiceOrderButtonProps {
  items: MenuItem[];
  vendorId: string;
  vendorName: string;
}

const VOICE_PARSE_PROMPT = `You are a voice ordering parser for a food app.
You will receive a spoken text transcript from a customer and a JSON list of available menu items.
Your job is to identify the menu item name, size (full or half), and quantity from the transcript.
Match the spoken item to the exact closest menu item name from the provided list.
Return ONLY a raw valid JSON object (no markdown, no backticks) with this structure:
{
  "matched": true | false,
  "item_name": "Exact Name From Menu",
  "size": "full" | "half",
  "quantity": number
}
If you cannot confidently match any menu item, return {"matched": false}.`;

export default function VoiceOrderButton({ items, vendorId, vendorName }: VoiceOrderButtonProps) {
  const { addItem } = useCart();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedOrder, setParsedOrder] = useState<{
    matchedItem: MenuItem;
    size: 'full' | 'half';
    quantity: number;
  } | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported) return null; // Graceful hide on unsupported browsers

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await parseVoiceOrder(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition error. Try speaking again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const parseVoiceOrder = async (text: string) => {
    setIsParsing(true);

    const menuContext = items.map(i => ({
      name: i.name,
      price_full: i.price_full,
      price_half: i.price_half,
    }));

    const resultStr = await askAI(VOICE_PARSE_PROMPT, text, { items: menuContext });

    try {
      // Clean any markdown formatting if present
      const cleanJson = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.matched && parsed.item_name) {
        const matchedItem = items.find(
          i => i.name.toLowerCase() === parsed.item_name.toLowerCase()
        ) || items.find(
          i => i.name.toLowerCase().includes(parsed.item_name.toLowerCase())
        );

        if (matchedItem) {
          setParsedOrder({
            matchedItem,
            size: parsed.size === 'half' && matchedItem.price_half ? 'half' : 'full',
            quantity: Math.max(1, parsed.quantity || 1),
          });
          setIsParsing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to parse voice response:', err);
    }

    setIsParsing(false);
    toast.error("Sorry, I didn't catch that clearly — try again or select from the menu.");
  };

  const confirmVoiceOrder = () => {
    if (!parsedOrder) return;
    const { matchedItem, size, quantity } = parsedOrder;

    for (let i = 0; i < quantity; i++) {
      addItem(matchedItem, size, vendorId, vendorName);
    }

    toast.success(`Added ${quantity}x ${matchedItem.name} (${size}) to cart! 🎉`);
    setParsedOrder(null);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={startListening}
        disabled={isListening || isParsing}
        className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : isParsing
              ? 'bg-amber-400 text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
        title="Voice Order"
      >
        {isListening ? (
          <>
            <MicOff size={14} /> Listening...
          </>
        ) : isParsing ? (
          <>
            <Sparkles size={14} className="animate-spin" /> Parsing...
          </>
        ) : (
          <>
            <Mic size={14} /> Speak to Order
          </>
        )}
      </motion.button>

      {/* Explicit Confirmation Modal */}
      <Modal
        isOpen={!!parsedOrder}
        onClose={() => setParsedOrder(null)}
        title="Confirm Voice Order"
      >
        {parsedOrder && (
          <div className="space-y-4">
            <div className="bg-primary-light/50 rounded-2xl p-4 text-center border border-primary/20">
              <span className="text-3xl mb-2 block">🎙️</span>
              <p className="text-xs text-text-muted mb-1">We heard:</p>
              <p className="text-xs italic text-text-secondary mb-3">"{transcript}"</p>
              <div className="bg-white rounded-xl p-3 border border-border-light shadow-xs">
                <p className="font-bold text-text-primary text-base">
                  {parsedOrder.quantity}x {parsedOrder.matchedItem.name}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  Size: {parsedOrder.size} · ₹
                  {(parsedOrder.size === 'half' && parsedOrder.matchedItem.price_half
                    ? parsedOrder.matchedItem.price_half
                    : parsedOrder.matchedItem.price_full) * parsedOrder.quantity}
                </p>
                <p className="text-[11px] text-primary font-semibold mt-1">
                  Cafe: {vendorName}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmVoiceOrder}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-primary-dark"
              >
                <Check size={16} /> Yes, Add to Cart
              </button>
              <button
                onClick={() => setParsedOrder(null)}
                className="px-4 bg-gray-100 text-text-secondary py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 cursor-pointer"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
