'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, Building2, MapPin, DollarSign, Target, ChevronRight,
  ArrowRight, Filter, X, TrendingUp, Users, Calendar, Globe,
  Briefcase,
} from 'lucide-react';
import { LogoMark } from '../Logo';

interface PublicFirm {
  id: string;
  slug: string;
  name: string;
  description: string;
  website: string;
  hq: string;
  stages: string[];
  sectors: string[];
  checkMin: string;
  checkMax: string;
  type: string;
  featured: boolean;
}

const STAGE_OPTIONS = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
const SECTOR_OPTIONS = ['SaaS', 'AI/ML', 'Fintech', 'Healthcare', 'Consumer', 'Enterprise', 'Crypto', 'Climate', 'E-commerce', 'Dev Tools'];
const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'vc', label: 'VC Fund' },
  { value: 'accelerator', label: 'Accelerator' },
  { value: 'angel', label: 'Angel' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  vc: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400' },
  accelerator: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  angel: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
};

const TYPE_LABELS: Record<string, string> = {
  vc: 'VC',
  accelerator: 'Accelerator',
  angel: 'Angel',
};

function FirmInitials({ name }: { name: string }) {
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-white text-sm font-bold" style={{ letterSpacing: '-0.02em' }}>{initials}</span>
    </div>
  );
}

interface Props {
  initialFirms: PublicFirm[];
  total: number;
}

export default function InvestorDirectory({ initialFirms, total }: Props) {
  const [firms, setFirms] = useState(initialFirms);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('');
  const [sector, setSector] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(total);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(total > 24);

  const search = async (resetPage = true) => {
    setLoading(true);
    const p = resetPage ? 1 : page + 1;
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (stage) params.set('stage', stage);
    if (sector) params.set('sector', sector);
    if (type) params.set('type', type);
    params.set('page', String(p));
    params.set('limit', '24');

    const res = await fetch(`/api/public/firms?${params}`);
    const data = await res.json();

    if (resetPage) {
      setFirms(data.firms);
      setPage(1);
    } else {
      setFirms((prev) => [...prev, ...data.firms]);
      setPage(p);
    }
    setTotalCount(data.total);
    setHasMore(p < data.totalPages);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const clearFilters = () => {
    setQuery('');
    setStage('');
    setSector('');
    setType('');
    setFirms(initialFirms);
    setTotalCount(total);
    setPage(1);
    setHasMore(total > 24);
  };

  const hasFilters = query || stage || sector || type;

  const activeFilters = [
    stage && { label: stage, clear: () => { setStage(''); setTimeout(() => search(), 0); } },
    sector && { label: sector, clear: () => { setSector(''); setTimeout(() => search(), 0); } },
    type && { label: TYPE_LABELS[type] || type, clear: () => { setType(''); setTimeout(() => search(), 0); } },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-semibold text-gray-900 uppercase" style={{ letterSpacing: '0.04em' }}>
              RoundBase
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/investors" className="text-sm font-medium text-indigo-600">
              Directory
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white via-white to-gray-50/80 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
              Find the right investor<br className="hidden sm:block" /> for your startup
            </h1>
            <p className="mt-3 text-base text-gray-500 leading-relaxed">
              Browse {totalCount}+ venture capital firms, accelerators, and angel investors.
              Filter by stage, sector, and check size to find your match.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-7 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, location, or description..."
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Search size={15} /> Search
            </button>
          </form>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <select
              value={stage}
              onChange={(e) => { setStage(e.target.value); setTimeout(() => search(), 0); }}
              className="text-sm px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none cursor-pointer hover:border-indigo-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 font-medium"
            >
              <option value="">All Stages</option>
              {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={sector}
              onChange={(e) => { setSector(e.target.value); setTimeout(() => search(), 0); }}
              className="text-sm px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none cursor-pointer hover:border-indigo-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 font-medium"
            >
              <option value="">All Sectors</option>
              {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setTimeout(() => search(), 0); }}
              className="text-sm px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none cursor-pointer hover:border-indigo-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 font-medium"
            >
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {/* Active filter chips */}
            {activeFilters.map((f) => (
              <button
                key={f.label}
                onClick={f.clear}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                {f.label} <X size={12} />
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-600 ml-1 font-medium">
                Clear all
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto tabular-nums font-medium">{totalCount} investor{totalCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-6 overflow-x-auto scrollbar-hide text-xs text-gray-400">
          <span className="flex items-center gap-1.5 flex-shrink-0"><Building2 size={12} className="text-indigo-400" /> <strong className="text-gray-700">{totalCount}</strong> Firms</span>
          <span className="flex items-center gap-1.5 flex-shrink-0"><Target size={12} className="text-amber-400" /> <strong className="text-gray-700">{STAGE_OPTIONS.length}</strong> Stages</span>
          <span className="flex items-center gap-1.5 flex-shrink-0"><Briefcase size={12} className="text-emerald-400" /> <strong className="text-gray-700">{SECTOR_OPTIONS.length}</strong> Sectors</span>
          <span className="flex items-center gap-1.5 flex-shrink-0"><Globe size={12} className="text-purple-400" /> <strong className="text-gray-700">Updated daily</strong></span>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {firms.map((firm) => {
            const tc = TYPE_COLORS[firm.type] || TYPE_COLORS.vc;
            return (
              <Link
                key={firm.id}
                href={`/investors/${firm.slug}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group relative overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Featured badge */}
                {firm.featured && (
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-bold uppercase rounded-bl-lg" style={{ letterSpacing: '0.05em' }}>
                    Featured
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <FirmInitials name={firm.name} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{firm.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${tc.bg} ${tc.text} rounded text-[9px] font-semibold uppercase`} style={{ letterSpacing: '0.03em' }}>
                        <span className={`w-1 h-1 rounded-full ${tc.dot}`} />
                        {TYPE_LABELS[firm.type] || firm.type}
                      </span>
                      {firm.hq && (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
                          <MapPin size={8} /> {firm.hq}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed mb-3">{firm.description}</p>

                {/* Stages */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {firm.stages.slice(0, 4).map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-indigo-50/80 text-indigo-600 rounded-md text-[10px] font-medium">{s}</span>
                  ))}
                  {firm.stages.length > 4 && (
                    <span className="px-2 py-0.5 text-[10px] text-gray-400 font-medium">+{firm.stages.length - 4}</span>
                  )}
                </div>

                {/* Sectors */}
                {firm.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {firm.sectors.slice(0, 3).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[10px] font-medium border border-gray-100">{s}</span>
                    ))}
                    {firm.sectors.length > 3 && (
                      <span className="px-2 py-0.5 text-[10px] text-gray-400 font-medium">+{firm.sectors.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                  {firm.checkMin && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={10} className="text-gray-300" />
                      <span className="text-[11px] font-semibold text-gray-700">{firm.checkMin} – {firm.checkMax}</span>
                    </div>
                  )}
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-indigo-400 transition-colors ml-auto flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={() => search(false)}
              disabled={loading}
              className="px-8 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Investors'}
            </button>
          </div>
        )}

        {firms.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No investors found</p>
            <p className="text-xs text-gray-400 mb-3">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Clear all filters</button>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>How to Find the Right Investor</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-xl">A quick guide to navigating this directory and finding investors who are a real fit for your startup.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                <Target size={16} className="text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Match by stage</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Filter by Pre-Seed, Seed, Series A, etc. to find firms that invest at your current stage. An investor who does Series B won&apos;t write your first check.
              </p>
            </div>
            <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <Briefcase size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Find domain expertise</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Narrow by sector — SaaS, Fintech, AI/ML, Healthcare. The best investors bring connections and insight in your specific market.
              </p>
            </div>
            <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <DollarSign size={16} className="text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Check the check size</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                An investor writing $100K checks has different expectations than one writing $10M. Make sure your raise aligns with their typical investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 py-14">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>Found your investors? Start your outreach.</h2>
          <p className="text-indigo-200 text-sm mb-6 max-w-md mx-auto">
            Track your pipeline, generate AI pitch decks, and send personalized emails — free for founders.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20"
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="text-xs text-gray-400 uppercase font-medium" style={{ letterSpacing: '0.04em' }}>RoundBase</span>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} RoundBase</p>
        </div>
      </footer>
    </div>
  );
}
