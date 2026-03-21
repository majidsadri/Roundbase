'use client';

import { useState, useEffect } from 'react';
import { LogoMark } from './Logo';
import {
  Search, Users, GitBranch, FileText, Sparkles, ArrowRight,
  BarChart3, Send, Target, Zap, ChevronRight, Globe, Download,
  CheckCircle2, TrendingUp, Shield, Clock, Mail, Linkedin,
  Building2, PieChart, Kanban, Star, MousePointerClick,
} from 'lucide-react';

/* ─── Feature deep-dive data ─── */
const FEATURE_SECTIONS = [
  {
    badge: 'Discovery',
    title: 'Find investors who actually fit',
    description: 'Stop cold-emailing random VCs. Our AI analyzes your stage, sector, and raise to surface investors with genuine strategic alignment.',
    points: [
      'AI-powered matching by stage, sector, and check size',
      'Crawl any VC website to extract team contacts',
      'Import from NFX Signal, CSV, or paste a list',
      'Smart deduplication — never add the same investor twice',
    ],
    icon: Search,
    color: 'indigo',
    mockup: 'discover',
  },
  {
    badge: 'Pipeline',
    title: 'Track every conversation in one place',
    description: 'From first intro to signed term sheet, see exactly where every investor stands. No more spreadsheet chaos.',
    points: [
      'Visual Kanban board: Researching → Contacted → Meeting → Committed',
      'Move investors through stages with one click',
      'Notes, follow-up reminders, and activity history',
      'See your funnel at a glance with pipeline stats',
    ],
    icon: Kanban,
    color: 'violet',
    mockup: 'pipeline',
  },
  {
    badge: 'Outreach',
    title: 'Personalized emails that get responses',
    description: 'AI drafts investor-specific emails that reference their portfolio, thesis, and what makes your startup relevant to them.',
    points: [
      'Auto-researches each investor\'s background and portfolio',
      'Generates custom talking points per investor',
      'Multiple tone options: warm intro, cold outreach, follow-up',
      'One-click copy — paste into your email client',
    ],
    icon: Send,
    color: 'emerald',
    mockup: 'outreach',
  },
  {
    badge: 'Materials',
    title: 'Generate pitch decks with AI',
    description: 'Upload your files and let AI create a compelling pitch deck. Refine with natural language prompts and export to PDF.',
    points: [
      'AI-generated slides from your project description',
      'Iterate with natural language: "make the market slide more data-driven"',
      'Upload supporting files — financials, one-pagers, memos',
      'Export polished PDFs ready for investor meetings',
    ],
    icon: FileText,
    color: 'amber',
    mockup: 'materials',
  },
];

const STATS = [
  { value: '10K+', label: 'Investors Discovered', icon: Users },
  { value: '2.5x', label: 'Faster Pipeline Setup', icon: TrendingUp },
  { value: '85%', label: 'Match Accuracy', icon: Target },
  { value: '< 30s', label: 'AI Outreach Generation', icon: Clock },
];

const HOW_IT_WORKS = [
  {
    title: 'Create your project',
    desc: 'Add your startup details — name, stage, sector, raise amount. Takes 60 seconds.',
    icon: Building2,
  },
  {
    title: 'Discover investors',
    desc: 'AI finds VCs that match your profile. Crawl firm websites for direct contacts.',
    icon: Search,
  },
  {
    title: 'Build your pipeline',
    desc: 'Add the best matches to your pipeline. Track every stage from research to commitment.',
    icon: GitBranch,
  },
  {
    title: 'Close your round',
    desc: 'Generate pitch decks, send personalized outreach, and manage commitments.',
    icon: Zap,
  },
];

/* ─── Feature mockup illustrations ─── */
function DiscoverMockup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <Search size={14} className="text-gray-400" />
        <div className="flex-1 h-7 bg-white rounded-lg border border-gray-200 px-3 flex items-center">
          <span className="text-xs text-gray-400">Search investors or paste a URL...</span>
        </div>
        <div className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-medium rounded-lg">Lookup</div>
      </div>
      <div className="p-3 space-y-2">
        {[
          { name: 'Sequoia Capital', fit: 92, stage: 'Series A', check: '$1-15M' },
          { name: 'Andreessen Horowitz', fit: 87, stage: 'Seed - B', check: '$500K-50M' },
          { name: 'First Round Capital', fit: 84, stage: 'Pre-Seed', check: '$250K-3M' },
        ].map((f) => (
          <div key={f.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-gray-900">{f.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400">{f.stage}</span>
                <span className="text-[10px] text-gray-400">{f.check}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              f.fit >= 90 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}>{f.fit}% fit</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineMockup() {
  const stages = [
    { label: 'Researching', color: 'bg-gray-100 text-gray-700', count: 3 },
    { label: 'Contacted', color: 'bg-blue-50 text-blue-700', count: 5 },
    { label: 'Meeting', color: 'bg-amber-50 text-amber-700', count: 2 },
    { label: 'Committed', color: 'bg-green-50 text-green-700', count: 1 },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Kanban size={14} className="text-violet-500" />
          <span className="text-xs font-semibold text-gray-700">Pipeline</span>
        </div>
        <span className="text-[10px] text-gray-400">11 investors</span>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2">
        {stages.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${s.color}`}>{s.label}</span>
              <span className="text-[9px] text-gray-400">{s.count}</span>
            </div>
            {Array.from({ length: Math.min(s.count, 3) }).map((_, i) => (
              <div key={i} className="h-7 bg-gray-50 rounded-md border border-gray-100 px-2 flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded-full mr-1.5" />
                <div className="h-1.5 bg-gray-200 rounded-full flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OutreachMockup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <Mail size={14} className="text-emerald-500" />
        <span className="text-xs font-semibold text-gray-700">Personalized Email</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">To:</span>
          <span className="text-[10px] font-medium text-gray-700">Sarah Chen — Partner at First Round</span>
        </div>
        <div className="text-[11px] text-gray-600 leading-relaxed space-y-2">
          <p>Hi Sarah,</p>
          <p>I noticed First Round led the seed round for <span className="bg-emerald-50 text-emerald-700 px-1 rounded">Linear</span> — our approach to
            <span className="bg-emerald-50 text-emerald-700 px-1 rounded">developer tools</span> shares a similar product philosophy...</p>
          <div className="h-1.5 bg-gray-100 rounded-full w-3/4" />
          <div className="h-1.5 bg-gray-100 rounded-full w-1/2" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium">
            <Sparkles size={10} /> AI Generated
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
            <MousePointerClick size={10} /> Copy
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialsMockup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <FileText size={14} className="text-amber-500" />
        <span className="text-xs font-semibold text-gray-700">Pitch Deck</span>
      </div>
      <div className="p-3 grid grid-cols-3 gap-2">
        {['Cover', 'Problem', 'Solution', 'Market', 'Traction', 'Team'].map((slide, i) => (
          <div key={slide} className="aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
            <span className="text-[9px] font-medium text-gray-400">{slide}</span>
            {i === 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
            )}
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 flex items-center gap-2">
        <div className="flex-1 h-7 bg-gray-50 rounded-lg border border-gray-200 px-2.5 flex items-center">
          <span className="text-[10px] text-gray-400">Make the traction slide more data-driven...</span>
        </div>
        <div className="px-2.5 py-1.5 bg-amber-500 text-white text-[10px] font-medium rounded-lg">Refine</div>
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => JSX.Element> = {
  discover: DiscoverMockup,
  pipeline: PipelineMockup,
  outreach: OutreachMockup,
  materials: MaterialsMockup,
};

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; border: string; gradient: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', border: 'border-indigo-100', gradient: 'from-indigo-50/80 to-white' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-50 text-violet-600 border-violet-100', border: 'border-violet-100', gradient: 'from-violet-50/80 to-white' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', border: 'border-emerald-100', gradient: 'from-emerald-50/80 to-white' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 border-amber-100', border: 'border-amber-100', gradient: 'from-amber-50/80 to-white' },
};

/* ─── Animated counter ─── */
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Users }) {
  return (
    <div className="text-center group">
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
        <Icon size={20} className="text-indigo-200" />
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
        {value}
      </div>
      <div className="text-xs text-indigo-200 font-medium">{label}</div>
    </div>
  );
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RoundBase',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.roundbase.net',
  description: 'AI-powered fundraising platform that helps startups find investors, manage their pipeline, generate pitch decks, and send personalized outreach.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free for early-stage founders',
  },
  featureList: [
    'AI-powered investor matching',
    'Fundraising pipeline management',
    'AI pitch deck generation',
    'Personalized investor outreach',
    'VC website crawling for contacts',
    'NFX Signal and CSV import',
  ],
};

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is RoundBase?',
      acceptedAnswer: { '@type': 'Answer', text: 'RoundBase is a free AI-powered fundraising platform that helps startups find the right investors, manage their fundraising pipeline, generate pitch decks, and send personalized outreach emails.' },
    },
    {
      '@type': 'Question',
      name: 'Is RoundBase free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, RoundBase is free to use for early-stage founders. No credit card required.' },
    },
    {
      '@type': 'Question',
      name: 'How does RoundBase find investors?',
      acceptedAnswer: { '@type': 'Answer', text: 'RoundBase uses AI to match your startup with investors based on stage, sector, check size, and strategic fit. You can also crawl VC websites for team contacts or import from NFX Signal and CSV files.' },
    },
    {
      '@type': 'Question',
      name: 'What stages does RoundBase support?',
      acceptedAnswer: { '@type': 'Answer', text: 'RoundBase supports all fundraising stages from Pre-Seed and Seed to Series A, Series B, and Growth rounds.' },
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-semibold text-gray-900 uppercase" style={{ letterSpacing: '0.04em' }}>
              RoundBase
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/investors"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Investors
            </a>
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium mb-6 border border-indigo-100">
              <Sparkles size={12} />
              AI-powered fundraising platform for startups
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold text-gray-900 leading-[1.08]"
              style={{ letterSpacing: '-0.03em' }}
            >
              Stop guessing who to pitch.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Start closing your round.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
              RoundBase helps startups discover matched investors, manage their fundraising pipeline, and generate pitch materials — all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/signup"
                className="group flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
              >
                Start Free — No Card Required
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#features"
                className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors rounded-xl border border-gray-200 hover:border-indigo-200 bg-white"
              >
                See How It Works
                <ChevronRight size={14} />
              </a>
            </div>

            {/* Trust bar */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><Shield size={12} className="text-gray-300" /> Your data stays private</span>
              <span className="flex items-center gap-1.5"><Zap size={12} className="text-gray-300" /> Set up in under 2 minutes</span>
              <span className="flex items-center gap-1.5"><Star size={12} className="text-gray-300" /> Free for early-stage founders</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6">
            {STATS.map((s) => (
              <AnimatedStat key={s.label} value={s.value} label={s.label} icon={s.icon} />
            ))}
          </div>
        </div>
      </section>

      {/* Feature deep dives */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900" style={{ letterSpacing: '-0.025em' }}>
              Everything you need to fundraise
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto text-base">
              From investor discovery to signed term sheets — RoundBase streamlines every step of your raise.
            </p>
          </div>

          <div className="space-y-24 sm:space-y-32">
            {FEATURE_SECTIONS.map((feature, idx) => {
              const colors = COLOR_MAP[feature.color];
              const Mockup = MOCKUP_MAP[feature.mockup];
              const isReversed = idx % 2 === 1;
              return (
                <div key={feature.title} className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 lg:gap-16`}>
                  {/* Text side */}
                  <div className="flex-1 max-w-lg">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border mb-4 ${colors.badge}`}>
                      <feature.icon size={11} />
                      {feature.badge}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3" style={{ letterSpacing: '-0.02em' }}>
                      {feature.title}
                    </h3>
                    <p className="text-base text-gray-500 leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <CheckCircle2 size={16} className={`${colors.text} flex-shrink-0 mt-0.5`} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mockup side */}
                  <div className="flex-1 w-full max-w-lg">
                    <div className={`rounded-2xl bg-gradient-to-br ${colors.gradient} p-5 sm:p-8`}>
                      <Mockup />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24 bg-gray-50/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.025em' }}>
              From zero to funded in 4 steps
            </h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              No complex onboarding. Set up in minutes, start reaching investors the same day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((s, idx) => (
              <div key={s.title} className="relative bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-100 transition-all group" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <s.icon size={18} />
                  </div>
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 -right-3 text-gray-300">
                      <ChevronRight size={16} />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{s.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / Who it's for */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.025em' }}>
              Built for founders at every stage
            </h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              Whether you&apos;re raising your first angel check or scaling to Series B, RoundBase adapts to your needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                stage: 'Pre-Seed & Seed',
                icon: Sparkles,
                color: 'indigo',
                benefits: [
                  'Discover angels and micro-VCs that invest at your stage',
                  'Generate a pitch deck from scratch with AI',
                  'Organize your first investor pipeline',
                ],
              },
              {
                stage: 'Series A',
                icon: TrendingUp,
                color: 'violet',
                benefits: [
                  'Target lead investors with the right check size',
                  'Personalized outreach referencing portfolio companies',
                  'Track 50+ conversations without losing context',
                ],
              },
              {
                stage: 'Series B+',
                icon: BarChart3,
                color: 'emerald',
                benefits: [
                  'Crawl growth-stage funds for direct contacts',
                  'Manage complex multi-round pipelines',
                  'Cross-reference investors across multiple projects',
                ],
              },
            ].map((s) => (
              <div
                key={s.stage}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-100 transition-all"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-3">{s.stage}</h3>
                <ul className="space-y-2.5">
                  {s.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] text-gray-500 leading-relaxed">
                      <CheckCircle2 size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ letterSpacing: '-0.025em' }}
          >
            Ready to find your investors?
          </h2>
          <p className="text-indigo-200 max-w-lg mx-auto mb-8 text-base leading-relaxed">
            Stop juggling spreadsheets and cold emails. RoundBase gives you AI-powered tools to find, reach, and close the right investors — faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/signup"
              className="group flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-lg"
            >
              Get Started Free
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Free to use. No credit card required. Set up in 2 minutes.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100 bg-gray-50/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <span className="text-xs text-gray-500 uppercase font-semibold" style={{ letterSpacing: '0.04em' }}>
                RoundBase
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()} RoundBase. Built for founders, by founders.
              </p>
              <a href="https://www.linkedin.com/company/roundbase/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-indigo-500 transition-colors">
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
