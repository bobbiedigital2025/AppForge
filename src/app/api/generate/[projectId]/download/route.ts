/**
 * API Route: GET /api/generate/[projectId]/download
 *
 * Packages all generated files for a project into a zip archive
 * and streams it back as a download.
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
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

  if (!project.files || project.files.length === 0) {
    return NextResponse.json({ error: 'No files generated yet' }, { status: 400 });
  }

  const zip = new JSZip();

  // Add every generated file at its declared path
  for (const file of project.files) {
    zip.file(file.path, file.content);
  }

  // Include the project specs as a manifest
  if (project.state.specs) {
    zip.file('appforge.manifest.json', JSON.stringify({
      id: project.state.id,
      name: project.state.name,
      idea: project.state.idea,
      generatedAt: new Date().toISOString(),
      specs: project.state.specs,
      architecture: project.state.architecture,
    }, null, 2));
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const safeName = project.state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'appforge-app';

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}.zip"`,
      'Content-Length': String(buffer.length),
    },
  });
}
