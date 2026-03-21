import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getPublicUrl } from '@/lib/supabase/storage';

function deserializeProject(row: Record<string, unknown>) {
  return {
    ...row,
    sectors: JSON.parse((row.sectors as string) || '[]'),
    files: ((row as Record<string, unknown>).files as Array<Record<string, unknown>> || []).map((f) => ({
      ...f,
      dataUrl: getPublicUrl((f as Record<string, unknown>).filePath as string),
    })),
  };
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.project.findMany({
    where: { userId: auth.userId },
    include: { files: true },
    orderBy: { createdAt: 'desc' },
  });

  // Seed default project if none exist for this user
  if (rows.length === 0) {
    const defaultProject = await prisma.project.create({
      data: {
        id: `proj_${Date.now().toString(36)}`,
        userId: auth.userId,
        name: 'My Project',
        description: 'Your first fundraising project',
        stage: 'Pre-Seed',
        deckUrl: '',
        raiseAmount: '',
        targetInvestors: '',
        sectors: JSON.stringify([]),
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
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { files: _files, ...projectData } = body;

  const data = {
    ...projectData,
    userId: auth.userId,
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
