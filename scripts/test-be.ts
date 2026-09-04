/**
 * Test backend agent alone with default specs.
 */
import { hasAIKey } from '../src/lib/agents/ai-client';
import { runBackendAgent } from '../src/lib/agents/codegen-agents';
import { generateDefaultArchitecture } from '../src/lib/agents/architect-agent';
import { generateDefaultSpecs } from '../src/lib/agents/pm-agent';

const noopLog = (_level: 'warn', _msg: string) => {};

async function main() {
  console.log('AI key:', hasAIKey());
  const pmOutput = generateDefaultSpecs('A dog walker app');
  const arch = generateDefaultArchitecture(pmOutput.specs, 'A dog walker app');

  console.log('--- BACKEND AGENT ---');
  const be = await runBackendAgent({ architecture: arch.architecture, specs: pmOutput.specs }, noopLog);
  console.log('Files:', be.files.map(f => f.path));
  console.log('First file preview:', be.files[0]?.content.slice(0, 200));
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
