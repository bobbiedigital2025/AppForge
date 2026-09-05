/**
 * API Route: GET /api/generate/[projectId]
 *
 * Returns the current state of a project — tasks, progress, logs, specs, files, etc.
 * The dashboard polls this to show real-time agent activity.
 * Now checks that the project belongs to the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject, getProjectFromSupabase } from '@/lib/agents/pipeline';
import { createServerClient } from '@/lib/supabase/server-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Get authenticated user
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Try in-memory first (active pipeline)
  const project = getProject(projectId);

  if (project) {
    return NextResponse.json(project);
  }

  // Try Supabase (completed/persisted project)
  const stored = await getProjectFromSupabase(projectId);
  if (stored) {
    return NextResponse.json({
      state: stored.state,
      progress: stored.progress,
      agentActivity: {},
      files: stored.files,
      ai: { configured: false, model: null },
      letta: { configured: false, agents: 0 },
      testResults: null,
      complianceChecks: null,
    });
  }

  return NextResponse.json({ error: 'Project not found' }, { status: 404 });
}
