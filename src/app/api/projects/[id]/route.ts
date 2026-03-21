import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  // Verify ownership
  const project = await prisma.project.findFirst({ where: { id, userId: auth.userId } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.projectFile.deleteMany({ where: { projectId: id } });
  await prisma.pipelineEntry.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
