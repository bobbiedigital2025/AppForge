/**
 * API Route: POST /api/generate
 * 
 * Takes a user's app idea, creates a project, and kicks off the agent pipeline.
 * Returns the project ID so the client can redirect to the dashboard and watch progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProject, listProjects } from '@/lib/agents/pipeline';

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

    const projectId = createProject(idea.trim());

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
  const projects = listProjects();
  return NextResponse.json({ projects });
}
