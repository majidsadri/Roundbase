import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const projectId = req.nextUrl.searchParams.get('projectId');
  const where = projectId
    ? { projectId, userId: auth.userId }
    : { userId: auth.userId };
  const rows = await prisma.pipelineEntry.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();

  // Support bulk create
  if (Array.isArray(body)) {
    const created = [];
    for (const entry of body) {
      const data = { ...entry, userId: auth.userId };
      const row = await prisma.pipelineEntry.upsert({
        where: { id: entry.id },
        create: data,
        update: data,
      });
      created.push(row);
    }
    return NextResponse.json(created);
  }

  const data = { ...body, userId: auth.userId };
  const row = await prisma.pipelineEntry.upsert({
    where: { id: body.id },
    create: data,
    update: data,
  });

  return NextResponse.json(row);
}
