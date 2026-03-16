'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Users, Kanban, TrendingUp } from 'lucide-react';
import { getInvestors, getPipeline, getProjects } from '@/lib/store';
import { PipelineEntry, Investor, STAGE_LABELS, STAGE_COLORS, PipelineStage } from '@/types';

export default function DashboardPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([getInvestors(), getPipeline(), getProjects()]).then(
      ([inv, pipe, proj]) => {
        setInvestors(inv);
        setPipeline(pipe);
        setProjects(proj);
      }
    );
  }, []);

  const investorMap = new Map(investors.map((i) => [i.id, i]));

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

  const stats = [
    { label: 'Investors', value: investors.length, icon: <Users size={16} /> },
    { label: 'In Pipeline', value: pipeline.length, icon: <Kanban size={16} /> },
    { label: 'Overdue', value: overdue.length, icon: <AlertCircle size={16} />, warn: overdue.length > 0 },
    { label: 'Projects', value: projects.length, icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200/60 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">{s.icon}</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 tabular-nums">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Overdue Follow-ups */}
        <div className="bg-white rounded-lg border border-gray-200/60 p-5">
          <h3 className="text-[13px] font-medium text-gray-900 mb-4 flex items-center gap-2">
            {overdue.length > 0 && <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />}
            Overdue Follow-ups
            {overdue.length > 0 && <span className="text-xs text-gray-400 font-normal ml-auto">{overdue.length}</span>}
          </h3>
          {overdue.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-300">All caught up</p>
            </div>
          ) : (
            <div className="space-y-0">
              {overdue.map((e) => {
                const inv = investorMap.get(e.investorId);
                if (!inv) return null;
                const daysLate = Math.floor(
                  (Date.now() - new Date(e.nextFollowup).getTime()) / 86400000
                );
                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-xs text-gray-400">{inv.firm}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STAGE_COLORS[e.stage as PipelineStage]}`}>
                        {STAGE_LABELS[e.stage as PipelineStage]}
                      </span>
                      <span className="text-[11px] text-red-400 font-medium w-12 text-right tabular-nums">{daysLate}d late</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-lg border border-gray-200/60 p-5">
          <h3 className="text-[13px] font-medium text-gray-900 mb-4 flex items-center gap-2">
            Upcoming Follow-ups
            {upcoming.length > 0 && <span className="text-xs text-gray-400 font-normal ml-auto">{upcoming.length}</span>}
          </h3>
          {upcoming.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-300">No upcoming follow-ups</p>
            </div>
          ) : (
            <div className="space-y-0">
              {upcoming.map((e) => {
                const inv = investorMap.get(e.investorId);
                if (!inv) return null;
                const daysUntil = Math.ceil(
                  (new Date(e.nextFollowup).getTime() - Date.now()) / 86400000
                );
                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-xs text-gray-400">{inv.firm}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STAGE_COLORS[e.stage as PipelineStage]}`}>
                        {STAGE_LABELS[e.stage as PipelineStage]}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium w-12 text-right tabular-nums">
                        {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline breakdown */}
      <div className="bg-white rounded-lg border border-gray-200/60 p-5">
        <h3 className="text-[13px] font-medium text-gray-900 mb-4">Pipeline Breakdown</h3>
        <div className="flex gap-2">
          {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((stage) => {
            const count = stageCount[stage] || 0;
            const total = pipeline.length || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={stage} className="flex-1 text-center">
                <div className={`py-3 rounded-md ${STAGE_COLORS[stage]}`}>
                  <p className="text-lg font-semibold tabular-nums">{count}</p>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">{STAGE_LABELS[stage]}</p>
                {pipeline.length > 0 && (
                  <p className="text-[10px] text-gray-300 tabular-nums">{pct}%</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
