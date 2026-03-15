import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function deserializeProject(row: Record<string, unknown>) {
  return {
    ...row,
    sectors: JSON.parse((row.sectors as string) || '[]'),
    files: ((row as Record<string, unknown>).files as Array<Record<string, unknown>> || []).map((f) => ({
      ...f,
      // Map filePath to dataUrl for backward compat with frontend
      dataUrl: (f as Record<string, unknown>).filePath,
    })),
  };
}

export async function GET() {
  const rows = await prisma.project.findMany({
    include: { files: true },
    orderBy: { createdAt: 'desc' },
  });

  // Seed default project if none exist
  if (rows.length === 0) {
    const defaultProject = await prisma.project.create({
      data: {
        id: 'jeeb',
        name: 'Jeeb',
        description: 'Digital business card & contact management app',
        stage: 'Pre-Seed',
        deckUrl: '',
        raiseAmount: '',
        targetInvestors: '',
        sectors: JSON.stringify(['SaaS', 'Consumer Internet', 'AI']),
        location: '',
        website: '',
        createdAt: new Date().toISOString(),
      },
      include: { files: true },
    });
    return NextResponse.json([deserializeProject(defaultProject as unknown as Record<string, unknown>)]);
  }

  return NextResponse.json(rows.map((r) => deserializeProject(r as unknown as Record<string, unknown>)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Separate files from the project data — files are managed via /api/files
  const { files: _files, ...projectData } = body;

  const data = {
    ...projectData,
    sectors: JSON.stringify(projectData.sectors || []),
  };

  const row = await prisma.project.upsert({
    where: { id: body.id },
    create: data,
    update: data,
    include: { files: true },
  });

  return NextResponse.json(deserializeProject(row as unknown as Record<string, unknown>));
}
