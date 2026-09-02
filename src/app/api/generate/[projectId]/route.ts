/**
 * API Route: GET /api/generate/[projectId]
 * 
 * Returns the current state of a project — tasks, progress, logs, specs, files, etc.
 * The dashboard polls this to show real-time agent activity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/agents/pipeline';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}
