/**
 * AppForge AI Client
 *
 * Unified AI calling layer. Uses the Telnyx Inference API —
 * OpenAI-compatible chat completions on Telnyx-owned GPUs.
 * Cheap, simple credit-based billing.
 *
 * Default model: MiniMax-M3 — cheapest on Telnyx, and (unlike the GLM
 * reasoning models) it puts its full output budget into the response
 * content instead of internal reasoning tokens, which matters for the
 * long structured JSON payloads the agents generate.
 * Override with AI_MODEL env var (e.g. "zai-org/GLM-5.2").
 *
 * When TELNYX_API_KEY is not configured, agents fall back
 * to their default generators (boilerplate mode).
 */

const TELNYX_URL = 'https://api.telnyx.com/v2/ai/chat/completions';

/** Default model — cheapest tier, full content output. */
const DEFAULT_MODEL = process.env.AI_MODEL || 'MiniMaxAI/MiniMax-M3-MXFP8';

/** True when an AI provider key is available. */
export function hasAIKey(): boolean {
  return !!process.env.TELNYX_API_KEY;
}

/** AI connection status for display in the dashboard. */
export function getAIStatus(): { connected: boolean; model: string } {
  return { connected: hasAIKey(), model: DEFAULT_MODEL };
}

/**
 * Call the AI with a system prompt and user prompt.
 * Returns the raw text content of the response.
 * Throws on API errors — callers should catch and fall back.
 */
export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    throw new Error('TELNYX_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s max per call

  const response = await fetch(TELNYX_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      // Compact prompts keep responses under 8K; truncation breaks parsers.
      max_tokens: 8192,
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Telnyx API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI returned an empty response');
  }

  return content;
}
