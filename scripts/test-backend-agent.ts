/**
 * Quick test: backend agent alone — debug raw response.
 */
import { hasAIKey } from '../src/lib/agents/ai-client';
import { BACKEND_AGENT_SYSTEM_PROMPT, buildBackendPrompt } from '../src/lib/agents/codegen-agents';
import { generateDefaultArchitecture } from '../src/lib/agents/architect-agent';
import { generateDefaultSpecs } from '../src/lib/agents/pm-agent';

async function main() {
  const pmOutput = generateDefaultSpecs('A dog walker app');
  const specs = pmOutput.specs;
  const arch = generateDefaultArchitecture(specs, 'A dog walker app');

  console.log('AI key:', hasAIKey());

  const apiKey = process.env.TELNYX_API_KEY!;
  const userPrompt = buildBackendPrompt({ architecture: arch.architecture, specs });
  console.log('Prompt length:', userPrompt.length);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  const res = await fetch('https://api.telnyx.com/v2/ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'MiniMaxAI/MiniMax-M3-MXFP8',
      messages: [
        { role: 'system', content: BACKEND_AGENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  }).finally(() => clearTimeout(timeout));

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  console.log('finish_reason:', data.choices?.[0]?.finish_reason);
  console.log('content length:', (msg?.content || '').length);
  console.log('reasoning length:', (msg?.reasoning_content || '').length);
  console.log('usage:', data.usage);
  console.log('content preview:', (msg?.content || '').slice(0, 300));
}

main().catch(console.error);
