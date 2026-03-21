import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import InvestorDirectory from '@/components/directory/InvestorDirectory';

export const metadata: Metadata = {
  title: 'Investor Directory — Find VCs, Angel Investors & Seed Funds | RoundBase',
  description: 'Browse venture capital firms, angel investors, and accelerators. Filter by stage, sector, check size, and location. Free investor database for startup founders raising pre-seed to Series B.',
  alternates: { canonical: '/investors' },
  openGraph: {
    title: 'Investor Directory — Find VCs & Angel Investors',
    description: 'Browse 30+ venture capital firms, angel investors, and accelerators. Free investor database for founders.',
    url: 'https://www.roundbase.net/investors',
  },
};

export const dynamic = 'force-dynamic';

export default async function InvestorsDirectoryPage() {
  const firms = await prisma.publicFirm.findMany({
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    take: 24,
  });

  const total = await prisma.publicFirm.count();

  const parsed = firms.map((f) => ({
    ...f,
    stages: JSON.parse(f.stages || '[]') as string[],
    sectors: JSON.parse(f.sectors || '[]') as string[],
    portfolio: JSON.parse(f.portfolio || '[]') as string[],
  }));

  return <InvestorDirectory initialFirms={parsed} total={total} />;
}
