/**
 * API Route: POST /api/generate
 * 
 * Takes a user's app idea, creates a project, and kicks off the agent pipeline.
 * Returns the project ID so the client can redirect to the dashboard and watch progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppForgeOrchestrator } from '@/lib/agents/orchestrator';
import { generateDefaultSpecs } from '@/lib/agents/pm-agent';

// In-memory project store (will be replaced with database in production)
const projectStore = new Map<string, { orchestrator: AppForgeOrchestrator; state: unknown }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idea: string = body.idea;

    if (!idea || idea.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed app idea (at least 10 characters)' },
        { status: 400 }
      );
    }

    // Create the project
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const orchestrator = new AppForgeOrchestrator(projectId, idea.trim());

    // Decompose the idea into tasks
    const tasks = orchestrator.decomposeIdea(idea.trim());

    // Generate initial specs (default/fallback mode — will be replaced with AI when API keys are configured)
    const { specs } = generateDefaultSpecs(idea.trim());

    // Store the project
    projectStore.set(projectId, {
      orchestrator,
      state: orchestrator.getState(),
    });

    // Export the store for other routes to access
    (globalThis as Record<string, unknown>).__appforgeProjects = projectStore;

    return NextResponse.json({
      projectId,
      tasks: tasks.length,
      specs,
      message: 'Project created. Agent team is starting...',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const store = (globalThis as Record<string, unknown>).__appforgeProjects as Map<string, unknown> | undefined;
  const projects = store ? Array.from(store.keys()) : [];
  return NextResponse.json({ projects });
}
