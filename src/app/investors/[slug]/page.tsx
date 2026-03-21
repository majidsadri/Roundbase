import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FirmProfile from '@/components/directory/FirmProfile';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const firm = await prisma.publicFirm.findUnique({ where: { slug } });
  if (!firm) return { title: 'Investor Not Found' };

  const stages = JSON.parse(firm.stages || '[]').join(', ');
  const sectors = JSON.parse(firm.sectors || '[]').slice(0, 3).join(', ');

  return {
    title: `${firm.name} — Investment Focus, Check Size & Portfolio | RoundBase`,
    description: `${firm.name} invests in ${stages} startups in ${sectors}. Check size: ${firm.checkMin}–${firm.checkMax}. View investment details, portfolio companies, and more.`,
    alternates: { canonical: `/investors/${firm.slug}` },
    openGraph: {
      title: `${firm.name} — Investor Profile`,
      description: `${firm.description.slice(0, 160)}`,
      url: `https://www.roundbase.net/investors/${firm.slug}`,
    },
  };
}

export default async function FirmPage({ params }: Props) {
  const { slug } = await params;
  const firm = await prisma.publicFirm.findUnique({ where: { slug } });
  if (!firm) notFound();

  const parsed = {
    ...firm,
    stages: JSON.parse(firm.stages || '[]') as string[],
    sectors: JSON.parse(firm.sectors || '[]') as string[],
    portfolio: JSON.parse(firm.portfolio || '[]') as string[],
  };

  // Get similar firms (overlapping stages/sectors)
  const allFirms = await prisma.publicFirm.findMany({
    where: { slug: { not: slug } },
    take: 100,
  });

  const similar = allFirms
    .map((f) => {
      const fStages = JSON.parse(f.stages || '[]') as string[];
      const fSectors = JSON.parse(f.sectors || '[]') as string[];
      const stageOverlap = parsed.stages.filter((s) => fStages.includes(s)).length;
      const sectorOverlap = parsed.sectors.filter((s) => fSectors.includes(s)).length;
      return {
        ...f,
        stages: fStages,
        sectors: fSectors,
        portfolio: JSON.parse(f.portfolio || '[]') as string[],
        score: stageOverlap + sectorOverlap,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: firm.name,
    url: firm.website,
    description: firm.description,
    address: { '@type': 'PostalAddress', addressLocality: firm.hq },
    foundingDate: firm.founded,
    knowsAbout: parsed.sectors,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FirmProfile firm={parsed} similarFirms={similar} />
    </>
  );
}
