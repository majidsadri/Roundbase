import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const file = await prisma.projectFile.findUnique({ where: { id } });
  if (file) {
    // Delete from disk
    const fullPath = path.join(process.cwd(), 'public', file.filePath);
    await unlink(fullPath).catch(() => null);
    await prisma.projectFile.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
