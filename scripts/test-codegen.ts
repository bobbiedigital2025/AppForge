/**
 * Test codegen agents (database, backend, frontend) with default specs.
 * Uses default PM/Architect output so we only make 3 AI calls, not 5.
 */
import { hasAIKey } from '../src/lib/agents/ai-client';
import { runDatabaseAgent, runBackendAgent, runFrontendAgent } from '../src/lib/agents/codegen-agents';
import { generateDefaultArchitecture } from '../src/lib/agents/architect-agent';
import { generateDefaultSpecs } from '../src/lib/agents/pm-agent';

const noopLog = (_level: 'warn', _msg: string) => {};

async function main() {
  console.log('AI key:', hasAIKey());

  const pmOutput = generateDefaultSpecs('A dog walker app');
  const specs = pmOutput.specs;
  const arch = generateDefaultArchitecture(specs, 'A dog walker app');

  console.log('--- DATABASE AGENT ---');
  const db = await runDatabaseAgent({ architecture: arch.architecture, specs }, noopLog);
  console.log('Files:', db.files.map(f => f.path));
  console.log('Schema preview:', db.files[0]?.content.slice(0, 150));

  console.log('--- BACKEND AGENT ---');
  const be = await runBackendAgent({ architecture: arch.architecture, specs }, noopLog);
  console.log('Files:', be.files.map(f => f.path));

  console.log('--- FRONTEND AGENT ---');
  const fe = await runFrontendAgent({ architecture: arch.architecture, specs }, noopLog);
  console.log('Files:', fe.files.map(f => f.path));

  console.log('\nTotal files:', db.files.length + be.files.length + fe.files.length);
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
