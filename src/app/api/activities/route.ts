import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const pipelineId = req.nextUrl.searchParams.get('pipelineId');
  const where = pipelineId ? { pipelineId } : {};
  const rows = await prisma.activity.findMany({ where, orderBy: { date: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const row = await prisma.activity.create({ data: body });
  return NextResponse.json(row);
}
