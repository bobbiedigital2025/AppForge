/**
 * API Route: GET /api/admin/projects
 * Returns all projects across all users (admin only).
 * Uses the service role key to bypass RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/server-client';

export async function GET(request: NextRequest) {
  // Verify the user is an admin
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Use admin client to fetch all projects (bypasses RLS)
  const admin = createAdminClient();

  const { data: projects, error } = await admin
    .from('projects')
    .select('id, name, idea, status, progress, created_at, user_id')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user emails for each project
  const userIds = [...new Set(projects?.map(p => p.user_id) || [])];
  let userEmails: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    userEmails = Object.fromEntries(
      (profiles || []).map((p: { id: string; email: string }) => [p.id, p.email])
    );
  }

  const projectsWithEmails = (projects || []).map(p => ({
    id: p.id,
    name: p.name,
    idea: p.idea,
    status: p.status,
    progress: p.progress,
    created_at: p.created_at,
    user_email: userEmails[p.user_id] || null,
  }));

  return NextResponse.json({ projects: projectsWithEmails });
}
