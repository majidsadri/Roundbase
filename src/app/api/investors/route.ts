import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function deserializeInvestor(row: Record<string, unknown>) {
  return {
    ...row,
    sectors: JSON.parse((row.sectors as string) || '[]'),
  };
}

export async function GET() {
  const rows = await prisma.investor.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows.map(deserializeInvestor));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support bulk create
  if (Array.isArray(body)) {
    const created = [];
    for (const inv of body) {
      const data = {
        ...inv,
        sectors: JSON.stringify(inv.sectors || []),
      };
      const row = await prisma.investor.upsert({
        where: { id: inv.id },
        create: data,
        update: data,
      });
      created.push(deserializeInvestor(row as Record<string, unknown>));
    }
    return NextResponse.json(created);
  }

  const data = {
    ...body,
    sectors: JSON.stringify(body.sectors || []),
  };

  const row = await prisma.investor.upsert({
    where: { id: body.id },
    create: data,
    update: data,
  });

  return NextResponse.json(deserializeInvestor(row as Record<string, unknown>));
}
