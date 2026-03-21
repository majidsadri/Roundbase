'use client';

import Link from 'next/link';
import {
  Building2, Globe, MapPin, DollarSign, Target, Calendar,
  Users, ChevronRight, ArrowRight, ArrowLeft, ExternalLink,
  Briefcase, TrendingUp, Linkedin, Layers, Award, Hash,
} from 'lucide-react';
import { LogoMark } from '../Logo';

interface PublicFirm {
  id: string;
  slug: string;
  name: string;
  description: string;
  website: string;
  linkedin: string;
  hq: string;
  stages: string[];
  sectors: string[];
  checkMin: string;
  checkMax: string;
  fundSize: string;
  portfolio: string[];
  founded: string;
  teamSize: string;
  type: string;
  featured: boolean;
}

interface Props {
  firm: PublicFirm;
  similarFirms: PublicFirm[];
}

const TYPE_LABELS: Record<string, string> = {
  vc: 'Venture Capital',
  accelerator: 'Accelerator',
  angel: 'Angel Investor',
  family_office: 'Family Office',
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  vc: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  accelerator: { bg: 'bg-amber-50', text: 'text-amber-700' },
  angel: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

function FirmInitials({ name, size = 'lg' }: { name: string; size?: 'lg' | 'sm' }) {
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className="text-white font-bold" style={{ letterSpacing: '-0.02em' }}>{initials}</span>
    </div>
  );
}

export default function FirmProfile({ firm, similarFirms }: Props) {
  const typeLabel = TYPE_LABELS[firm.type] || 'Investor';
  const tc = TYPE_COLORS[firm.type] || TYPE_COLORS.vc;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-semibold text-gray-900 uppercase" style={{ letterSpacing: '0.04em' }}>RoundBase</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/investors" className="text-sm font-medium text-indigo-600">Directory</Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/signup" className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-2.5 flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <ChevronRight size={10} />
          <Link href="/investors" className="hover:text-gray-600 transition-colors">Investor Directory</Link>
          <ChevronRight size={10} />
          <span className="text-gray-600 font-medium">{firm.name}</span>
        </div>
      </div>

      {/* Hero header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <FirmInitials name={firm.name} />
            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.025em' }}>{firm.name}</h1>
                <span className={`px-2.5 py-0.5 ${tc.bg} ${tc.text} rounded-lg text-[10px] font-semibold uppercase`} style={{ letterSpacing: '0.04em' }}>
                  {typeLabel}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {firm.hq && (
                  <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} className="text-gray-400" /> {firm.hq}</span>
                )}
                {firm.founded && (
                  <span className="flex items-center gap-1 text-sm text-gray-500"><Calendar size={13} className="text-gray-400" /> Founded {firm.founded}</span>
                )}
                {firm.teamSize && (
                  <span className="flex items-center gap-1 text-sm text-gray-500"><Users size={13} className="text-gray-400" /> {firm.teamSize} people</span>
                )}
              </div>
              {/* Links */}
              <div className="flex items-center gap-3 mt-3">
                {firm.website && (
                  <a href={firm.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <Globe size={12} /> Website <ExternalLink size={9} className="text-gray-400" />
                  </a>
                )}
                {firm.linkedin && (
                  <a href={firm.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">
                    <Linkedin size={12} /> LinkedIn <ExternalLink size={9} className="text-blue-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{firm.description}</p>
            </div>

            {/* Key numbers */}
            {(firm.checkMin || firm.fundSize) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {firm.fundSize && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                        <TrendingUp size={13} className="text-purple-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5" style={{ letterSpacing: '0.05em' }}>Fund Size / AUM</p>
                    <p className="text-base font-bold text-gray-900">{firm.fundSize}</p>
                  </div>
                )}
                {firm.checkMin && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <DollarSign size={13} className="text-emerald-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5" style={{ letterSpacing: '0.05em' }}>Check Size</p>
                    <p className="text-base font-bold text-gray-900">{firm.checkMin} – {firm.checkMax}</p>
                  </div>
                )}
                {firm.portfolio.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Award size={13} className="text-amber-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5" style={{ letterSpacing: '0.05em' }}>Portfolio</p>
                    <p className="text-base font-bold text-gray-900">{firm.portfolio.length}+ companies</p>
                  </div>
                )}
              </div>
            )}

            {/* Investment Focus */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={14} className="text-indigo-500" />
                Investment Focus
              </h2>

              <div className="space-y-5">
                {firm.stages.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-medium mb-2" style={{ letterSpacing: '0.05em' }}>Stages</p>
                    <div className="flex flex-wrap gap-2">
                      {firm.stages.map((s) => (
                        <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {firm.sectors.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-medium mb-2" style={{ letterSpacing: '0.05em' }}>Sectors</p>
                    <div className="flex flex-wrap gap-2">
                      {firm.sectors.map((s) => (
                        <span key={s} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-100">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio */}
            {firm.portfolio.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={14} className="text-indigo-500" />
                  Notable Portfolio Companies
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {firm.portfolio.map((p) => (
                    <div key={p} className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50/80 rounded-xl border border-gray-100">
                      <div className="w-7 h-7 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <Hash size={11} className="text-gray-400" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 truncate">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* CTA */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
              <h3 className="text-sm font-semibold mb-2">Raising a round?</h3>
              <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                Track your outreach to {firm.name} and {similarFirms.length > 0 ? `${similarFirms.length}+ similar` : 'other'} investors with RoundBase — free for founders.
              </p>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Get Started Free <ArrowRight size={14} />
              </Link>
            </div>

            {/* Quick facts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase" style={{ letterSpacing: '0.05em' }}>At a Glance</h3>
              <div className="space-y-0">
                {[
                  { label: 'Type', value: typeLabel, show: !!firm.type },
                  { label: 'Founded', value: firm.founded, show: !!firm.founded },
                  { label: 'Headquarters', value: firm.hq, show: !!firm.hq },
                  { label: 'Team Size', value: firm.teamSize, show: !!firm.teamSize },
                  { label: 'Fund Size', value: firm.fundSize, show: !!firm.fundSize },
                  { label: 'Check Size', value: firm.checkMin ? `${firm.checkMin} – ${firm.checkMax}` : '', show: !!firm.checkMin },
                ].filter(r => r.show).map((row, i, arr) => (
                  <div key={row.label} className={`flex items-center justify-between py-3 text-xs ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-gray-700 font-semibold text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar firms */}
            {similarFirms.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase" style={{ letterSpacing: '0.05em' }}>Similar Investors</h3>
                <div className="space-y-1">
                  {similarFirms.map((sf) => (
                    <Link
                      key={sf.id}
                      href={`/investors/${sf.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <FirmInitials name={sf.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{sf.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{sf.stages.slice(0, 2).join(', ')}{sf.hq ? ` · ${sf.hq}` : ''}</p>
                      </div>
                      <ChevronRight size={12} className="text-gray-200 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <Link href="/investors" className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={13} /> Back to Investor Directory
          </Link>
        </div>
      </div>

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
