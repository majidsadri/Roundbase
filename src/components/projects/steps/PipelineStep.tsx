'use client';

import { useState, useEffect } from 'react';
import {
  Kanban, ChevronRight, Loader2, Users, ExternalLink,
} from 'lucide-react';
import { Project, Investor, PipelineEntry } from '@/types';
import { getPipeline, getInvestors, savePipelineEntry } from '@/lib/store';
import InvestorDrawer from '../../InvestorDrawer';

const PIPELINE_STAGES = [
  { key: 'researching', label: 'Researching', color: 'bg-gray-100 text-gray-700' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700' },
  { key: 'meeting', label: 'Meeting', color: 'bg-amber-50 text-amber-700' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-purple-50 text-purple-700' },
  { key: 'committed', label: 'Committed', color: 'bg-green-50 text-green-700' },
  { key: 'passed', label: 'Passed', color: 'bg-red-50 text-red-600' },
] as const;

const NEXT_STAGE: Record<string, string> = {
  researching: 'contacted',
  contacted: 'meeting',
  meeting: 'negotiating',
  negotiating: 'committed',
};

interface Props {
  project: Project;
  onReload: () => void;
  onGoToInvestors?: () => void;
}

export default function PipelineStep({ project, onReload, onGoToInvestors }: Props) {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [investors, setInvestors] = useState<Map<string, Investor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [drawerInvestor, setDrawerInvestor] = useState<Investor | null>(null);

  const load = async () => {
    setLoading(true);
    const [pipe, invs] = await Promise.all([
      getPipeline(project.id),
      getInvestors(),
    ]);
    setEntries(pipe);
    setInvestors(new Map(invs.map((i) => [i.id, i])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const moveToNext = async (entry: PipelineEntry) => {
    const next = NEXT_STAGE[entry.stage];
    if (!next) return;
    await savePipelineEntry({ ...entry, stage: next as PipelineEntry['stage'] });
    await load();
    onReload();
  };

  const grouped = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    entries: entries.filter((e) => e.stage === stage.key),
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
        <Loader2 size={24} className="mx-auto mb-2 text-indigo-300 animate-spin" />
        <p className="text-sm text-gray-400">Loading pipeline...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Users size={20} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">No investors in pipeline yet</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Find investors that match your project and add them to start tracking your outreach.</p>
        {onGoToInvestors && (
          <button
            onClick={onGoToInvestors}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <Users size={12} /> Find Investors
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {grouped.filter((g) => g.entries.length > 0).map((group) => (
          <div key={group.key} className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${group.color}`}>
                  {group.label}
                </span>
                <span className="text-xs text-gray-400">{group.entries.length}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {group.entries.map((entry) => {
                const inv = investors.get(entry.investorId);
                if (!inv) return null;
                const nextStage = NEXT_STAGE[entry.stage];
                return (
                  <div key={entry.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDrawerInvestor(inv)}>
                      <p className="text-sm font-medium text-gray-900 truncate">{inv.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {inv.role ? `${inv.role}, ` : ''}{inv.firm}
                      </p>
                    </div>
                    {inv.checkSize && (
                      <span className="text-xs text-gray-400 hidden sm:block">{inv.checkSize}</span>
                    )}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {nextStage && (
                        <button
                          onClick={() => moveToNext(entry)}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                          title={`Move to ${nextStage}`}
                        >
                          <ChevronRight size={12} />
                          {PIPELINE_STAGES.find((s) => s.key === nextStage)?.label}
                        </button>
                      )}
                      <button
                        onClick={() => setDrawerInvestor(inv)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                        title="View details"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="mt-3 bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center justify-between" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2">
          <Kanban size={14} className="text-indigo-500" />
          <span className="text-sm font-medium text-gray-700">Total: {entries.length} investors</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {grouped.filter((g) => g.entries.length > 0).map((g) => (
            <span key={g.key}>{g.label}: {g.entries.length}</span>
          ))}
        </div>
      </div>

      {drawerInvestor && (
        <InvestorDrawer
          investor={drawerInvestor}
          onClose={() => setDrawerInvestor(null)}
          onUpdate={() => { load(); onReload(); }}
        />
      )}
    </>
  );
}
