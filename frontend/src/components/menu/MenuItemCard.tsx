import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import type { MenuItem } from '../../lib/types';
import VegIndicator from '../ui/VegIndicator';
import { useCart } from '../../contexts/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  vendorId: string;
  vendorName: string;
}

export default function MenuItemCard({ item, vendorId, vendorName }: MenuItemCardProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const [selectedSize, setSelectedSize] = useState<'full' | 'half'>(
    item.price_half ? 'full' : 'full'
  );

  const cartItem = cartItems.find(
    ci => ci.menu_item.id === item.id && ci.size === selectedSize
  );
  const quantity = cartItem?.quantity || 0;

  const currentPrice = selectedSize === 'half' && item.price_half
    ? item.price_half
    : item.price_full;

  const discountedPrice = item.flash_discount_percent > 0
    ? currentPrice * (1 - item.flash_discount_percent / 100)
    : currentPrice;

  const handleAdd = () => {
    if (!item.available) return;
    addItem(item, selectedSize, vendorId, vendorName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-4 shadow-card border border-border-light transition-all duration-200 ${
        !item.available ? 'opacity-50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <VegIndicator veg={item.veg} size="sm" />
            {item.flash_discount_percent > 0 && (
              <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-md">
                {item.flash_discount_percent}% OFF
              </span>
            )}
          </div>

          <h3 className="font-semibold text-text-primary text-sm leading-tight mb-0.5 truncate">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs text-text-muted mb-1.5 line-clamp-2">{item.description}</p>
          )}

          {/* Pieces info */}
          {(item.pieces_full || item.pieces_half) && (
            <p className="text-[10px] text-text-muted mb-1.5">
              {item.pieces_full && `${item.pieces_full} pcs full`}
              {item.pieces_full && item.pieces_half && ' / '}
              {item.pieces_half && `${item.pieces_half} pcs half`}
              {item.serving_note && ` • ${item.serving_note}`}
            </p>
          )}

          {/* Size selector */}
          {item.price_half && (
            <div className="flex gap-1.5 mb-2">
              <button
                onClick={() => setSelectedSize('full')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedSize === 'full'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                Full ₹{item.price_full}
              </button>
              <button
                onClick={() => setSelectedSize('half')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedSize === 'half'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                Half ₹{item.price_half}
              </button>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-text-primary">
              ₹{Math.round(discountedPrice)}
            </span>
            {item.flash_discount_percent > 0 && (
              <span className="text-xs text-text-muted line-through">
                ₹{currentPrice}
              </span>
            )}
          </div>
        </div>

        {/* Right: Image + Add button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-24 h-24 rounded-xl bg-primary-light overflow-hidden flex items-center justify-center">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">
                {item.veg ? '🥗' : '🍗'}
              </span>
            )}
          </div>

          {/* Add / Quantity control */}
          {!item.available ? (
            <span className="text-[10px] font-semibold text-nonveg">Sold Out</span>
          ) : quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleAdd}
              className="bg-white border-2 border-primary text-primary px-5 py-1.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer"
            >
              ADD
            </motion.button>
          ) : (
            <div className="flex items-center gap-1 bg-primary rounded-xl px-1 py-0.5">
              <button
                onClick={() => updateQuantity(item.id, selectedSize, quantity - 1)}
                className="p-1 text-white hover:bg-primary-dark rounded-lg cursor-pointer"
              >
                <Minus size={14} />
              </button>
              <span className="text-white font-bold text-sm min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, selectedSize, quantity + 1)}
                className="p-1 text-white hover:bg-primary-dark rounded-lg cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
