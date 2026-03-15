import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  const where = projectId ? { projectId } : {};
  const rows = await prisma.pipelineEntry.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support bulk create
  if (Array.isArray(body)) {
    const created = [];
    for (const entry of body) {
      const row = await prisma.pipelineEntry.upsert({
        where: { id: entry.id },
        create: entry,
        update: entry,
      });
      created.push(row);
    }
    return NextResponse.json(created);
  }

  const row = await prisma.pipelineEntry.upsert({
    where: { id: body.id },
    create: body,
    update: body,
  });

  return NextResponse.json(row);
}
