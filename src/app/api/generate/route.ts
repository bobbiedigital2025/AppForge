/**
 * API Route: POST /api/generate
 *
 * Takes a user's app idea, creates a project, and kicks off the agent pipeline.
 * Returns the project ID so the client can redirect to the dashboard and watch progress.
 * Now requires authentication — projects are scoped to the logged-in user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProject, listProjectsForUser } from '@/lib/agents/pipeline';
import { createServerClient } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create a project.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const idea: string = body.idea;

    if (!idea || idea.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed app idea (at least 10 characters)' },
        { status: 400 }
      );
    }

    const projectId = createProject(idea.trim(), user.id);

    return NextResponse.json({
      projectId,
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
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ projects: [] });
  }

  const projects = await listProjectsForUser(user.id);
  return NextResponse.json({ projects });
}
