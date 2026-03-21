import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const pipelineId = req.nextUrl.searchParams.get('pipelineId');
  if (pipelineId) {
    // Verify the pipeline entry belongs to this user
    const entry = await prisma.pipelineEntry.findFirst({ where: { id: pipelineId, userId: auth.userId } });
    if (!entry) return NextResponse.json([]);
  }

  const where = pipelineId ? { pipelineId } : {};
  const rows = await prisma.activity.findMany({ where, orderBy: { date: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const row = await prisma.activity.create({ data: body });
  return NextResponse.json(row);
}
