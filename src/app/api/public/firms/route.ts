import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const stage = searchParams.get('stage') || '';
  const sector = searchParams.get('sector') || '';
  const type = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { hq: { contains: q } },
    ];
  }

  if (type) {
    where.type = type;
  }

  // For stage/sector filtering we search within JSON arrays stored as strings
  if (stage) {
    where.stages = { contains: stage };
  }
  if (sector) {
    where.sectors = { contains: sector };
  }

  const [firms, total] = await Promise.all([
    prisma.publicFirm.findMany({
      where: where as any,
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.publicFirm.count({ where: where as any }),
  ]);

  return NextResponse.json({
    firms: firms.map((f) => ({
      ...f,
      stages: JSON.parse(f.stages || '[]'),
      sectors: JSON.parse(f.sectors || '[]'),
      portfolio: JSON.parse(f.portfolio || '[]'),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
