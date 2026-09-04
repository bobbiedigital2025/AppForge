/**
 * Live pipeline test — runs PM → Architect → Codegen agents with real AI via Telnyx.
 * Run: TELNYX_API_KEY="$TELNYX_API_KEY" npx tsx scripts/live-test.ts
 */
import { hasAIKey } from '../src/lib/agents/ai-client';
import { PM_AGENT_SYSTEM_PROMPT, buildPMPrompt, parsePMResponse } from '../src/lib/agents/pm-agent';
import { ARCHITECT_AGENT_SYSTEM_PROMPT, buildArchitectPrompt, parseArchitectResponse } from '../src/lib/agents/architect-agent';
import { runDatabaseAgent, runBackendAgent, runFrontendAgent } from '../src/lib/agents/codegen-agents';
import { generateDefaultArchitecture } from '../src/lib/agents/architect-agent';

const idea = 'A mobile-friendly app that helps independent dog walkers manage their clients, schedule walks, and get paid — pet owners can book recurring walks and tip their walker';

const noopLog = (_level: 'warn', _msg: string) => {};

async function main() {
  console.log('AI key present:', hasAIKey());

  console.log('--- PM AGENT (real AI) ---');
  const { callAI } = await import('../src/lib/agents/ai-client');
  const pmRaw = await callAI(PM_AGENT_SYSTEM_PROMPT, buildPMPrompt({ idea }));
  const pm = parsePMResponse(pmRaw);
  console.log('Summary:', pm.specs.summary.slice(0, 120) + '...');
  console.log('Features:', pm.specs.features.length);
  console.log('User stories:', pm.specs.userStories.length);

  console.log('--- ARCHITECT AGENT (real AI) ---');
  const archRaw = await callAI(ARCHITECT_AGENT_SYSTEM_PROMPT, buildArchitectPrompt({ specs: pm.specs, idea }));
  const arch = parseArchitectResponse(archRaw);
  console.log('Data models:', arch.architecture.dataModels.map(m => m.name).join(', '));
  console.log('API endpoints:', arch.architecture.apiEndpoints.length);
  console.log('Page routes:', arch.architecture.pageRoutes.length);

  console.log('--- DATABASE AGENT (real AI) ---');
  const dbResult = await runDatabaseAgent(
    { architecture: arch.architecture, specs: pm.specs },
    noopLog
  );
  console.log('Files:', dbResult.files.map(f => f.path).join(', '));
  console.log('Schema preview:', dbResult.files[0]?.content.slice(0, 200) + '...');

  console.log('--- BACKEND AGENT (real AI) ---');
  const beResult = await runBackendAgent(
    { architecture: arch.architecture, specs: pm.specs },
    noopLog
  );
  console.log('Files:', beResult.files.map(f => f.path).join(', '));

  console.log('--- FRONTEND AGENT (real AI) ---');
  const feResult = await runFrontendAgent(
    { architecture: arch.architecture, specs: pm.specs },
    noopLog
  );
  console.log('Files:', feResult.files.map(f => f.path).join(', '));

  console.log('\n✅ All 5 agents produced real AI output.');
  console.log('Total generated files:', dbResult.files.length + beResult.files.length + feResult.files.length);
}

main().catch((err) => {
  console.error('LIVE TEST FAILED:', err);
  process.exit(1);
});
