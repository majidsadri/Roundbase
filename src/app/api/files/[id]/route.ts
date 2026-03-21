import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { deleteFromStorage } from '@/lib/supabase/storage';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const file = await prisma.projectFile.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });

  if (file && file.project.userId === auth.userId) {
    await deleteFromStorage(file.filePath).catch(() => null);
    await prisma.projectFile.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
