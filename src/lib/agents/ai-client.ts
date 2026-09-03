/**
 * AppForge AI Client
 *
 * Unified AI calling layer. Uses OpenRouter as the provider —
 * one API key gives access to Gemini 2.5 Flash and dozens of
 * other models with simple credit-based billing.
 *
 * When OPENROUTER_API_KEY is not configured, agents fall back
 * to their default generators (boilerplate mode).
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Default model — fast and very cheap (~$0.10/M input tokens). */
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

/** True when an AI provider key is available. */
export function hasAIKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Call the AI with a system prompt and user prompt.
 * Returns the raw text content of the response.
 * Throws on API errors — callers should catch and fall back.
 */
export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/bobbiedigital2025/AppForge',
      'X-Title': 'AppForge',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI returned an empty response');
  }

  return content;
}
