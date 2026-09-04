/**
 * Test database agent alone with default specs.
 */
import { hasAIKey } from '../src/lib/agents/ai-client';
import { runDatabaseAgent } from '../src/lib/agents/codegen-agents';
import { generateDefaultArchitecture } from '../src/lib/agents/architect-agent';
import { generateDefaultSpecs } from '../src/lib/agents/pm-agent';

const noopLog = (_level: 'warn', _msg: string) => {};

async function main() {
  console.log('AI key:', hasAIKey());
  const pmOutput = generateDefaultSpecs('A dog walker app');
  const arch = generateDefaultArchitecture(pmOutput.specs, 'A dog walker app');

  console.log('--- DATABASE AGENT ---');
  const db = await runDatabaseAgent({ architecture: arch.architecture, specs: pmOutput.specs }, noopLog);
  console.log('Files:', db.files.map(f => f.path));
  console.log('Schema preview:', db.files[0]?.content.slice(0, 200));
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
