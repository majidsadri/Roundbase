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
    { label: 'Total Investors', value: investors.length, icon: <Users size={18} />, accent: 'bg-blue-50 text-blue-600' },
    { label: 'In Pipeline', value: pipeline.length, icon: <Kanban size={18} />, accent: 'bg-violet-50 text-violet-600' },
    { label: 'Overdue', value: overdue.length, icon: <AlertCircle size={18} />, accent: overdue.length > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600' },
    { label: 'Projects', value: projects.length, icon: <TrendingUp size={18} />, accent: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.accent}`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Overdue Follow-ups */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            Overdue Follow-ups
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
                  <div key={e.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-xs text-gray-400">{inv.firm}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STAGE_COLORS[e.stage as PipelineStage]}`}>
                        {STAGE_LABELS[e.stage as PipelineStage]}
                      </span>
                      <span className="text-[11px] text-red-400 font-medium w-12 text-right">{daysLate}d late</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Upcoming Follow-ups
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
                  <div key={e.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-xs text-gray-400">{inv.firm}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STAGE_COLORS[e.stage as PipelineStage]}`}>
                        {STAGE_LABELS[e.stage as PipelineStage]}
                      </span>
                      <span className="text-[11px] text-blue-500 font-medium w-12 text-right">
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
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-[13px] font-semibold text-gray-900 mb-4">Pipeline Breakdown</h3>
        <div className="flex gap-2">
          {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((stage) => {
            const count = stageCount[stage] || 0;
            const total = pipeline.length || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={stage} className="flex-1 text-center group">
                <div className={`py-3 rounded-lg ${STAGE_COLORS[stage]} transition-transform group-hover:scale-105`}>
                  <p className="text-xl font-bold">{count}</p>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">{STAGE_LABELS[stage]}</p>
                {pipeline.length > 0 && (
                  <p className="text-[10px] text-gray-300">{pct}%</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
