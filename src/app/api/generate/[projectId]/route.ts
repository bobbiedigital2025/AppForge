/**
 * API Route: GET /api/generate/[projectId]
 * 
 * Returns the current state of a project — tasks, progress, logs, specs, etc.
 * The dashboard polls this to show real-time agent activity.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const store = (globalThis as Record<string, unknown>).__appforgeProjects as
    | Map<string, { orchestrator: { getState: () => unknown; getProgress: () => number; getAgentActivity: () => unknown } }>
    | undefined;

  if (!store || !store.has(projectId)) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { orchestrator } = store.get(projectId)!;
  const state = orchestrator.getState();
  const progress = orchestrator.getProgress();
  const agentActivity = orchestrator.getAgentActivity();

  return NextResponse.json({
    state,
    progress,
    agentActivity,
  });
}
