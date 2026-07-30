/* ============================================================
 * VITeBites — Centralized AI Integration Layer
 * OpenRouter Client with rate-limiting, retries, and fallbacks
 * ============================================================ */

export const AI_MODEL = 'google/gemini-2.5-flash:free';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 2000; // 2 sec client-side rate limit

export async function askAI(
  systemPrompt: string,
  userMessage: string,
  context?: object
): Promise<string> {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
    return 'Please wait a moment before asking another question.';
  }
  lastRequestTime = now;

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(context
      ? [{ role: 'system', content: `CONTEXT DATA:\n${JSON.stringify(context, null, 2)}` }]
      : []),
    { role: 'user', content: userMessage },
  ];

  let attempt = 0;
  const maxRetries = 1;

  while (attempt <= maxRetries) {
    try {
      if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
        // Mock response if no OpenRouter key is configured
        return generateMockAIResponse(systemPrompt, userMessage, context);
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://vitebites.app',
          'X-Title': 'VITeBites',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();

      if (answer) return answer;
      throw new Error('Empty response from AI');
    } catch (err) {
      console.warn(`askAI attempt ${attempt + 1} failed:`, err);
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  // Graceful fallback if OpenRouter is unreachable or fails
  return generateMockAIResponse(systemPrompt, userMessage, context);
}

// Grounded fallback response when offline or API key absent
function generateMockAIResponse(
  _systemPrompt: string,
  userMessage: string,
  context?: any
): string {
  const query = userMessage.toLowerCase();
  const items = context?.items || context || [];

  if (Array.isArray(items) && items.length > 0) {
    const matched = items.find((i: any) =>
      query.includes(i.name?.toLowerCase()) ||
      i.name?.toLowerCase().includes(query)
    );

    if (matched) {
      let details = `${matched.name} costs ₹${matched.price_full}`;
      if (matched.pieces_full) details += ` (${matched.pieces_full} pieces)`;
      if (matched.serving_note) details += ` · ${matched.serving_note}`;
      return details + '.';
    }
  }

  return "Sorry, I couldn't find exact details for that in the current menu. Please ask the cafe staff directly at the counter.";
}
