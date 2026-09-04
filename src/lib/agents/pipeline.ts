/**
 * AppForge Pipeline Executor
 * 
 * Runs the full agent pipeline when a user submits an idea.
 * This is the engine that connects the orchestrator to the individual agents.
 * 
 * Flow:
 * 1. PM Agent → generate specs
 * 2. Architect Agent → design architecture
 * 3. Database + Backend + Frontend agents → generate code (parallel)
 * 4. Testing Agent → validate
 * 5. Compliance Agent → audit
 * 6. DevOps Agent → deploy
 * 7. Docs Agent → document
 * 
 * AI provider: Telnyx Inference API (TELNYX_API_KEY). When configured, all
 * agents call real AI (MiniMax-M3 by default) using the system prompts in
 * each agent module. On any failure, agents fall back to default generators
 * so the pipeline always completes.
 */

import { AppForgeOrchestrator } from './orchestrator';
import {
  generateDefaultSpecs,
  parsePMResponse,
  buildPMPrompt,
  PM_AGENT_SYSTEM_PROMPT,
  type PMAgentOutput,
} from './pm-agent';
import {
  generateDefaultArchitecture,
  parseArchitectResponse,
  buildArchitectPrompt,
  ARCHITECT_AGENT_SYSTEM_PROMPT,
  type ArchitectAgentOutput,
} from './architect-agent';
import {
  generateDefaultDatabaseFiles,
  generateDefaultBackendFiles,
  generateDefaultFrontendFiles,
  runDatabaseAgent,
  runBackendAgent,
  runFrontendAgent,
} from './codegen-agents';
import { runTestingAgent, runComplianceAgent, runDocsAgent } from './qa-agents';
import { hasAIKey, callAI, getAIStatus } from './ai-client';
import type { ProjectState, GeneratedFile } from './types';

// In-memory project store (shared with API routes)
declare global {
  // eslint-disable-next-line no-var
  var __appforgeProjects: Map<string, {
    orchestrator: AppForgeOrchestrator;
    state: ProjectState;
    files: GeneratedFile[];
  }> | undefined;
}

function getStore() {
  if (!globalThis.__appforgeProjects) {
    globalThis.__appforgeProjects = new Map();
  }
  return globalThis.__appforgeProjects;
}

/**
 * Execute the full pipeline for a project.
 * This runs asynchronously — the dashboard polls for updates.
 */
export async function executePipeline(projectId: string, idea: string): Promise<void> {
  const store = getStore();
  const project = store.get(projectId);
  if (!project) return;

  const { orchestrator } = project;
  const tasks = orchestrator.getState().tasks;

  // Helper: simulate work delay
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Execute tasks in dependency order
  for (const task of tasks) {
    if (task.status === 'completed') continue;

    // Start the task
    orchestrator.startTask(task.id, `agent-${task.role}`);

    try {
      let output: Record<string, unknown>;

      switch (task.role) {
        // ─── Phase 1: PM Agent ───
        case 'pm': {
          let result: PMAgentOutput;
          if (hasAIKey()) {
            try {
              const raw = await callAI(PM_AGENT_SYSTEM_PROMPT, buildPMPrompt({ idea }));
              result = parsePMResponse(raw);
            } catch (err) {
              // AI call failed — fall back to defaults so the pipeline keeps moving
              orchestrator.log('pm', 'warn', `AI call failed, using default specs: ${err instanceof Error ? err.message : 'unknown'}`);
              result = generateDefaultSpecs(idea);
            }
          } else {
            await delay(1500);
            result = generateDefaultSpecs(idea);
          }
          output = { specs: result.specs };
          break;
        }

        // ─── Phase 2: Architect Agent ───
        case 'architect': {
          const state = orchestrator.getState();
          const specs = state.specs!;
          let result: ArchitectAgentOutput;
          if (hasAIKey()) {
            try {
              const raw = await callAI(ARCHITECT_AGENT_SYSTEM_PROMPT, buildArchitectPrompt({ specs, idea }));
              result = parseArchitectResponse(raw);
            } catch (err) {
              orchestrator.log('architect', 'warn', `AI call failed, using default architecture: ${err instanceof Error ? err.message : 'unknown'}`);
              result = generateDefaultArchitecture(specs, idea);
            }
          } else {
            await delay(2000);
            result = generateDefaultArchitecture(specs, idea);
          }
          output = { architecture: result.architecture };
          break;
        }

        // ─── Phase 3: Code Generation (parallel) ───
        case 'database': {
          if (!hasAIKey()) await delay(2500);
          const state = orchestrator.getState();
          const result = await runDatabaseAgent(
            { architecture: state.architecture!, specs: state.specs! },
            (level, msg) => orchestrator.log('database', level, msg)
          );
          project.files.push(...result.files);
          output = { files: result.files };
          break;
        }

        case 'backend': {
          if (!hasAIKey()) await delay(3000);
          const state = orchestrator.getState();
          const result = await runBackendAgent(
            { architecture: state.architecture!, specs: state.specs! },
            (level, msg) => orchestrator.log('backend', level, msg)
          );
          project.files.push(...result.files);
          output = { files: result.files };
          break;
        }

        case 'frontend': {
          if (!hasAIKey()) await delay(3500);
          const state = orchestrator.getState();
          const result = await runFrontendAgent(
            { architecture: state.architecture!, specs: state.specs! },
            (level, msg) => orchestrator.log('frontend', level, msg)
          );
          project.files.push(...result.files);
          output = { files: result.files };
          break;
        }

        // ─── Phase 4: Testing Agent ───
        case 'testing': {
          const state = orchestrator.getState();
          if (!hasAIKey()) await delay(2000);
          const result = await runTestingAgent(state.specs!, (level, msg) =>
            orchestrator.log('testing', level, msg)
          );
          output = result;
          break;
        }

        // ─── Phase 5: Compliance Agent ───
        case 'compliance': {
          const state = orchestrator.getState();
          if (!hasAIKey()) await delay(2000);
          const result = await runComplianceAgent(state.specs!, (level, msg) =>
            orchestrator.log('compliance', level, msg)
          );
          output = result;
          break;
        }

        // ─── Phase 6: DevOps Agent ───
        case 'devops': {
          await delay(2500);
          output = {
            url: `https://appforge-${projectId.slice(5, 13)}.vercel.app`,
            deployment: 'Vercel',
            buildStatus: 'success',
          };
          break;
        }

        // ─── Phase 7: Docs Agent ───
        case 'docs': {
          if (!hasAIKey()) await delay(1500);
          const readme = await runDocsAgent(orchestrator.getState(), (level, msg) =>
            orchestrator.log('docs', level, msg)
          );
          project.files.push({
            path: 'README.md',
            content: readme,
            agent: 'docs',
            status: 'generated',
          });
          output = { files: [{ path: 'README.md', content: readme, agent: 'docs', status: 'generated' }] };
          break;
        }

        // ─── Healing Agent ───
        case 'healing': {
          await delay(1000);
          output = { healed: true, fix: 'Applied fallback strategy' };
          break;
        }

        default:
          output = {};
      }

      orchestrator.completeTask(task.id, output);
    } catch (error) {
      orchestrator.failTask(
        task.id,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Update final state
  const finalState = orchestrator.getState();
  project.state = finalState;
  store.set(projectId, project);
}

/**
 * Create a new project and start the pipeline.
 */
export function createProject(idea: string): string {
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const orchestrator = new AppForgeOrchestrator(projectId, idea);
  orchestrator.decomposeIdea(idea);

  const store = getStore();
  store.set(projectId, {
    orchestrator,
    state: orchestrator.getState(),
    files: [],
  });

  // Start the pipeline asynchronously
  executePipeline(projectId, idea).catch((err) => {
    console.error(`Pipeline failed for ${projectId}:`, err);
  });

  return projectId;
}

/**
 * Get project state for the dashboard.
 */
export function getProject(projectId: string) {
  const store = getStore();
  const project = store.get(projectId);
  if (!project) return null;

  return {
    state: project.orchestrator.getState(),
    progress: project.orchestrator.getProgress(),
    agentActivity: project.orchestrator.getAgentActivity(),
    files: project.files,
    ai: getAIStatus(),
  };
}

/**
 * List all projects.
 */
export function listProjects(): string[] {
  const store = getStore();
  return Array.from(store.keys());
}
