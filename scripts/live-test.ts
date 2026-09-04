/**
 * Live pipeline test — runs PM + Architect agents with real AI via Telnyx.
 * Run: TELNYX_API_KEY="$TELNYX_API_KEY" npx tsx scripts/live-test.ts
 */
import { hasAIKey, callAI } from '../src/lib/agents/ai-client';
import { PM_AGENT_SYSTEM_PROMPT, buildPMPrompt, parsePMResponse } from '../src/lib/agents/pm-agent';
import { ARCHITECT_AGENT_SYSTEM_PROMPT, buildArchitectPrompt, parseArchitectResponse } from '../src/lib/agents/architect-agent';

const idea = 'A mobile-friendly app that helps independent dog walkers manage their clients, schedule walks, and get paid — pet owners can book recurring walks and tip their walker';

async function main() {
  console.log('AI key present:', hasAIKey());
  console.log('--- PM AGENT (real AI) ---');
  const pmRaw = await callAI(PM_AGENT_SYSTEM_PROMPT, buildPMPrompt({ idea }));
  const pm = parsePMResponse(pmRaw);
  console.log('Summary:', pm.specs.summary);
  console.log('Audience:', pm.specs.targetAudience);
  console.log('Features:', pm.specs.features.length);
  pm.specs.features.slice(0, 6).forEach(f => console.log('  -', f.name, '(' + f.priority + '/' + f.complexity + ')'));
  console.log('User stories:', pm.specs.userStories.length);
  console.log('Monetization:', pm.specs.monetization);
  console.log('Marketplace:', pm.specs.marketplace);

  console.log('--- ARCHITECT AGENT (real AI) ---');
  const archRaw = await callAI(ARCHITECT_AGENT_SYSTEM_PROMPT, buildArchitectPrompt({ specs: pm.specs, idea }));
  const arch = parseArchitectResponse(archRaw);
  console.log('Overview:', arch.architecture.overview.slice(0, 220) + '...');
  console.log('Data models:', arch.architecture.dataModels.map(m => m.name).join(', '));
  console.log('API endpoints:', arch.architecture.apiEndpoints.length);
  console.log('Page routes:', arch.architecture.pageRoutes.length);
}

main().catch((err) => {
  console.error('LIVE TEST FAILED:', err);
  process.exit(1);
});
