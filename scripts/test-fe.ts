/**
 * Test frontend agent alone with default specs.
 */
import { hasAIKey } from '../src/lib/agents/ai-client';
import { runFrontendAgent } from '../src/lib/agents/codegen-agents';
import { generateDefaultArchitecture } from '../src/lib/agents/architect-agent';
import { generateDefaultSpecs } from '../src/lib/agents/pm-agent';

const noopLog = (_level: 'warn', _msg: string) => {};

async function main() {
  console.log('AI key:', hasAIKey());
  const pmOutput = generateDefaultSpecs('A dog walker app');
  const arch = generateDefaultArchitecture(pmOutput.specs, 'A dog walker app');

  console.log('--- FRONTEND AGENT ---');
  const fe = await runFrontendAgent({ architecture: arch.architecture, specs: pmOutput.specs }, noopLog);
  console.log('Files:', fe.files.map(f => f.path));
  console.log('First file preview:', fe.files[0]?.content.slice(0, 200));
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
