'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle, Users, Kanban, DollarSign, ArrowRight,
  ChevronRight, Plus, Clock, Calendar, Building2, FileText,
  Target, Sparkles, BarChart3, TrendingUp, ArrowUpRight,
  Activity, CheckCircle2, Circle,
} from 'lucide-react';
import { getInvestors, getPipeline, getProjects } from '@/lib/store';
import {
  PipelineEntry, Investor, Project, STAGE_LABELS, STAGE_COLORS, PipelineStage,
  CommitStatus,
} from '@/types';
import ProjectLogo from './ProjectLogo';

const FUNNEL_STAGES: PipelineStage[] = ['researching', 'reached_out', 'meeting', 'pitch', 'term_sheet', 'closed'];

function parseAmount(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.kmb]/gi, '').toLowerCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (cleaned.endsWith('m')) return num * 1_000_000;
  if (cleaned.endsWith('k')) return num * 1_000;
  if (cleaned.endsWith('b')) return num * 1_000_000_000;
  return num;
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toLocaleString()}`;
  return '$0';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  onNavigate: (page: 'dashboard' | 'investors' | 'pipeline' | 'discover' | 'projects') => void;
}

export default function DashboardPage({ onNavigate }: Props) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getInvestors(), getPipeline(), getProjects()]).then(
      ([inv, pipe, proj]) => {
        setInvestors(inv);
        setPipeline(pipe);
        setProjects(proj);
        setLoaded(true);
      }
    );
  }, []);

  const investorMap = new Map(investors.map((i) => [i.id, i]));

  // ─── Calculations ─────────────────────────────────────────
  const overdue = pipeline.filter(
    (e) => e.nextFollowup && new Date(e.nextFollowup) < new Date() && e.stage !== 'closed' && e.stage !== 'passed'
  );

  const upcoming = pipeline
    .filter(
      (e) =>
        e.nextFollowup &&
        new Date(e.nextFollowup) >= new Date() &&
        e.stage !== 'closed' &&
        e.stage !== 'passed'
    )
    .sort((a, b) => new Date(a.nextFollowup).getTime() - new Date(b.nextFollowup).getTime())
    .slice(0, 5);

  const stageCount: Record<string, number> = {};
  pipeline.forEach((e) => {
    stageCount[e.stage] = (stageCount[e.stage] || 0) + 1;
  });

  const activeCount = pipeline.filter((e) => e.stage !== 'closed' && e.stage !== 'passed').length;
  const passedCount = stageCount['passed'] || 0;
  const closedCount = stageCount['closed'] || 0;

  // Round progress
  const totalTarget = projects.reduce((sum, p) => sum + parseAmount(p.raiseAmount), 0);
  const commitBuckets = { interested: 0, verbal: 0, soft_circle: 0, committed: 0, wired: 0 };
  pipeline.forEach((e) => {
    const amt = parseAmount(e.commitAmount || '');
    const status = (e.commitStatus || '') as CommitStatus;
    if (amt > 0 && status && status in commitBuckets) {
      commitBuckets[status as keyof typeof commitBuckets] += amt;
    }
  });
  const totalCommitted = commitBuckets.committed + commitBuckets.wired;
  const totalSoftCircle = commitBuckets.soft_circle;
  const totalVerbal = commitBuckets.verbal + commitBuckets.interested;
  const totalPledged = totalCommitted + totalSoftCircle + totalVerbal;
  const pctCommitted = totalTarget > 0 ? Math.min((totalCommitted / totalTarget) * 100, 100) : 0;
  const pctSoft = totalTarget > 0 ? Math.min((totalSoftCircle / totalTarget) * 100, 100 - pctCommitted) : 0;
  const pctVerbal = totalTarget > 0 ? Math.min((totalVerbal / totalTarget) * 100, 100 - pctCommitted - pctSoft) : 0;

  // Per-project pipeline counts
  const projectPipelineCounts = new Map<string, { total: number; active: number; committed: number }>();
  pipeline.forEach((e) => {
    const curr = projectPipelineCounts.get(e.projectId) || { total: 0, active: 0, committed: 0 };
    curr.total++;
    if (e.stage !== 'closed' && e.stage !== 'passed') curr.active++;
    if (e.stage === 'closed' || e.commitStatus === 'committed' || e.commitStatus === 'wired') curr.committed++;
    projectPipelineCounts.set(e.projectId, curr);
  });

  // Funnel
  const reachedStage: Record<string, number> = {};
  FUNNEL_STAGES.forEach((s) => { reachedStage[s] = 0; });
  const stageOrder: Record<string, number> = {};
  FUNNEL_STAGES.forEach((s, i) => { stageOrder[s] = i; });
  pipeline.forEach((e) => {
    const currentIdx = stageOrder[e.stage] ?? -1;
    FUNNEL_STAGES.forEach((s) => {
      if (stageOrder[s] <= currentIdx) reachedStage[s]++;
    });
    if (e.stage === 'passed') reachedStage['researching']++;
  });

  // Recent activity — last 10 pipeline entries by date
  const recentActivity = [...pipeline]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // ─── Loading state ────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="space-y-5">
        <div className="h-16 rounded-2xl shimmer-loading" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl h-24 shimmer-loading" />
          ))}
        </div>
        <div className="rounded-2xl h-32 shimmer-loading" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl h-64 shimmer-loading" />
          <div className="rounded-2xl h-64 shimmer-loading" />
        </div>
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────
  if (projects.length === 0 && investors.length === 0) {
    return (
      <div className="max-w-lg mx-auto pt-8 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">Welcome to RoundBase</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Start by creating a project for your fundraise, then discover investors that match your startup.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => onNavigate('projects')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Plus size={16} /> Create Project
            </button>
            <button
              onClick={() => onNavigate('discover')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <Users size={16} /> Discover Investors
            </button>
          </div>
        </div>
      </div>
    );
  }

  const conversionRate = pipeline.length > 0 ? Math.round((closedCount / pipeline.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} &middot; {pipeline.length} investor{pipeline.length !== 1 ? 's' : ''} in pipeline
          </p>
        </div>
        <button
          onClick={() => onNavigate('discover')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-[13px] font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus size={14} /> Add Investors
        </button>
      </div>

      {/* ─── Metric Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Projects',
            value: projects.length,
            icon: Building2,
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50',
            nav: 'projects' as const,
          },
          {
            label: 'Total Investors',
            value: investors.length,
            icon: Users,
            color: 'text-violet-500',
            bgColor: 'bg-violet-50',
            nav: 'investors' as const,
          },
          {
            label: 'Active Pipeline',
            value: activeCount,
            icon: Activity,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50',
            nav: 'pipeline' as const,
          },
          {
            label: 'Conversion Rate',
            value: `${conversionRate}%`,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50',
            subtitle: `${closedCount} closed of ${pipeline.length}`,
          },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => card.nav && onNavigate(card.nav)}
            className={`bg-white rounded-2xl p-4 text-left border border-gray-100 transition-all group ${card.nav ? 'hover:border-indigo-200 hover:shadow-md cursor-pointer' : 'cursor-default'}`}
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon size={15} className={card.color} />
              </div>
              {card.nav && <ArrowUpRight size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />}
            </div>
            <p className="text-2xl font-semibold text-gray-900 tabular-nums tracking-tight">{card.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{card.label}</p>
            {card.subtitle && <p className="text-[10px] text-gray-300 mt-0.5">{card.subtitle}</p>}
          </button>
        ))}
      </div>

      {/* ─── Overdue Alert Banner ────────────────────────────── */}
      {overdue.length > 0 && (
        <button
          onClick={() => onNavigate('pipeline')}
          className="w-full flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3.5 text-left hover:bg-red-100/60 transition-colors group"
        >
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle size={15} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-red-700">
              {overdue.length} overdue follow-up{overdue.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-red-500/70 mt-0.5 truncate">
              {overdue.slice(0, 3).map((e) => investorMap.get(e.investorId)?.name).filter(Boolean).join(', ')}
              {overdue.length > 3 ? ` +${overdue.length - 3} more` : ''}
            </p>
          </div>
          <ChevronRight size={14} className="text-red-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
        </button>
      )}

      {/* ─── Round Progress ──────────────────────────────────── */}
      {totalTarget > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-gray-900">Round Progress</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatAmount(totalPledged)} of {formatAmount(totalTarget)} target
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {totalTarget > 0 ? Math.round((totalPledged / totalTarget) * 100) : 0}%
              </p>
              <p className="text-[10px] text-gray-400">raised</p>
            </div>
          </div>

          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            {pctCommitted > 0 && (
              <div className="bg-indigo-600 transition-all duration-500" style={{ width: `${pctCommitted}%` }} />
            )}
            {pctSoft > 0 && (
              <div className="bg-indigo-300 transition-all duration-500" style={{ width: `${pctSoft}%` }} />
            )}
            {pctVerbal > 0 && (
              <div className="bg-indigo-100 transition-all duration-500" style={{ width: `${pctVerbal}%` }} />
            )}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
            {[
              { label: 'Committed', amount: totalCommitted, color: 'bg-indigo-600' },
              { label: 'Soft Circle', amount: totalSoftCircle, color: 'bg-indigo-300' },
              { label: 'Verbal', amount: totalVerbal, color: 'bg-indigo-100 border border-indigo-200' },
            ].filter(b => b.amount > 0).map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${bucket.color}`} />
                <span className="text-[11px] text-gray-500">
                  {bucket.label} <span className="font-medium text-gray-700">{formatAmount(bucket.amount)}</span>
                </span>
              </div>
            ))}
            {totalPledged === 0 && <p className="text-[11px] text-gray-400">No commitments yet</p>}
          </div>
        </div>
      )}

      {/* ─── Projects Overview ───────────────────────────────── */}
      {projects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-gray-900">Projects</h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-[11px] text-indigo-500 font-medium hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {projects.map((p) => {
              const counts = projectPipelineCounts.get(p.id) || { total: 0, active: 0, committed: 0 };
              const fileCount = (p.files || []).length;
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate('projects')}
                  className="w-full px-5 py-3.5 flex items-center gap-3.5 hover:bg-gray-50/50 transition-colors text-left group"
                >
                  <ProjectLogo logoUrl={p.logoUrl} name={p.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{p.name}</h4>
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">{p.stage}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {p.raiseAmount && (
                        <span className="font-medium text-gray-500 flex items-center gap-1">
                          <DollarSign size={9} className="text-gray-400" />{p.raiseAmount}
                        </span>
                      )}
                      {counts.total > 0 && (
                        <span className="flex items-center gap-1">
                          <Activity size={9} /> {counts.active} active
                          {counts.committed > 0 && <span className="text-emerald-500">&middot; {counts.committed} closed</span>}
                        </span>
                      )}
                      {counts.total === 0 && <span>No pipeline yet</span>}
                      {fileCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText size={9} /> {fileCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Two-column: Pipeline + Follow-ups ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Funnel */}
        {pipeline.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-indigo-500" />
                <h3 className="text-[13px] font-semibold text-gray-900">Pipeline Funnel</h3>
              </div>
              <button
                onClick={() => onNavigate('pipeline')}
                className="text-[11px] text-indigo-500 font-medium hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
              >
                Details <ChevronRight size={12} />
              </button>
            </div>
            <div className="p-5">
              {/* Stage summary row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {([
                  { label: 'Researching', key: 'researching', color: 'text-gray-600' },
                  { label: 'Reached Out', key: 'reached_out', color: 'text-blue-600' },
                  { label: 'In Meetings', key: 'meeting', color: 'text-violet-600' },
                  { label: 'Closed', key: 'closed', color: 'text-emerald-600' },
                ] as const).map((item) => (
                  <div key={item.key} className="text-center">
                    <p className={`text-lg font-semibold tabular-nums ${item.color}`}>{stageCount[item.key] || 0}</p>
                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Conversion funnel bars */}
              <div className="space-y-1.5">
                {FUNNEL_STAGES.map((stage, idx) => {
                  const count = reachedStage[stage] || 0;
                  const prevCount = idx > 0 ? (reachedStage[FUNNEL_STAGES[idx - 1]] || 0) : count;
                  const convRate = prevCount > 0 && idx > 0 ? Math.round((count / prevCount) * 100) : null;
                  const barWidth = pipeline.length > 0 ? Math.max((count / pipeline.length) * 100, 2) : 0;

                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16 text-right flex-shrink-0 truncate font-medium">
                        {STAGE_LABELS[stage]}
                      </span>
                      <div className="flex-1 h-5 bg-gray-50 rounded-md overflow-hidden relative">
                        <div
                          className={`h-full rounded-md transition-all duration-500 ${stage === 'closed' ? 'bg-emerald-500' : stage === 'term_sheet' ? 'bg-indigo-500' : 'bg-indigo-200'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium tabular-nums text-gray-600">
                          {count}
                        </span>
                      </div>
                      {convRate !== null && (
                        <span className="text-[9px] text-gray-300 w-7 flex-shrink-0 tabular-nums font-medium">{convRate}%</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pass rate */}
              {passedCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Passed / Declined</span>
                  <span className="text-[11px] text-gray-500 font-medium tabular-nums">{passedCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-ups Column */}
        <div className="space-y-4">
          {/* Upcoming Follow-ups */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-indigo-400" />
                  <h3 className="text-[13px] font-semibold text-gray-900">Upcoming</h3>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md font-medium">{upcoming.length} scheduled</span>
              </div>
              <div className="divide-y divide-gray-50">
                {upcoming.map((e) => {
                  const inv = investorMap.get(e.investorId);
                  if (!inv) return null;
                  const daysUntil = Math.ceil((new Date(e.nextFollowup).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={e.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Circle size={10} className="text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-900 truncate">{inv.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{inv.firm}</p>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium tabular-nums flex-shrink-0 ${
                        daysUntil === 0 ? 'bg-indigo-50 text-indigo-600' : daysUntil <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No follow-ups helper */}
          {overdue.length === 0 && upcoming.length === 0 && pipeline.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={16} className="text-gray-300" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">No follow-ups scheduled</p>
              <p className="text-[11px] text-gray-400 mt-1">Add follow-up dates to pipeline entries to track them here</p>
            </div>
          )}

          {/* Recent Activity (compact) */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-gray-400" />
                  <h3 className="text-[13px] font-semibold text-gray-900">Recent Activity</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {recentActivity.slice(0, 5).map((e) => {
                  const inv = investorMap.get(e.investorId);
                  const proj = projects.find((p) => p.id === e.projectId);
                  if (!inv) return null;

                  const stageIconMap: Record<string, typeof CheckCircle2> = {
                    closed: CheckCircle2,
                    term_sheet: FileText,
                    pitch: Target,
                    meeting: Users,
                    reached_out: ArrowRight,
                    researching: Circle,
                  };
                  const StageIcon = stageIconMap[e.stage] || Circle;

                  return (
                    <div key={e.id} className="px-5 py-2.5 flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        e.stage === 'closed' ? 'bg-emerald-50' :
                        e.stage === 'term_sheet' ? 'bg-indigo-50' :
                        'bg-gray-50'
                      }`}>
                        <StageIcon size={11} className={
                          e.stage === 'closed' ? 'text-emerald-500' :
                          e.stage === 'term_sheet' ? 'text-indigo-500' :
                          'text-gray-400'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-700 truncate">
                          <span className="font-medium text-gray-900">{inv.name}</span>
                          <span className="text-gray-300 mx-1">/</span>
                          <span className="text-gray-400">{inv.firm}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded-md font-medium ${STAGE_COLORS[e.stage as PipelineStage] || 'bg-gray-50 text-gray-500'}`}>
                            {STAGE_LABELS[e.stage as PipelineStage] || e.stage}
                          </span>
                          {proj && <span className="text-gray-300">{proj.name}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-300 flex-shrink-0 tabular-nums">{timeAgo(e.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Quick Actions ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            title: 'Discover Investors',
            desc: 'Find VCs that match your project',
            icon: Sparkles,
            gradient: 'from-indigo-500 to-blue-500',
            nav: 'discover' as const,
          },
          {
            title: 'Pitch Deck',
            desc: 'Generate or refine with AI',
            icon: FileText,
            gradient: 'from-violet-500 to-purple-500',
            nav: 'projects' as const,
          },
          {
            title: 'Pipeline',
            desc: 'Track and manage conversations',
            icon: Kanban,
            gradient: 'from-emerald-500 to-teal-500',
            nav: 'pipeline' as const,
          },
        ].map((action) => (
          <button
            key={action.title}
            onClick={() => onNavigate(action.nav)}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-gray-200 hover:shadow-md transition-all group"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className={`w-9 h-9 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3`}>
              <action.icon size={15} className="text-white" />
            </div>
            <h4 className="text-[13px] font-medium text-gray-900 mb-0.5">{action.title}</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
