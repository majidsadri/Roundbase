'use client';

import { useState, useEffect } from 'react';
import {
  Plus, DollarSign, Sparkles, Loader2, Users, Star, Tag, Send,
} from 'lucide-react';
import { Project, Investor } from '@/types';
import {
  uid, getPipeline, getInvestors, getRecommendedInvestors, savePipelineEntry,
} from '@/lib/store';
import InvestorDrawer from '../../InvestorDrawer';

interface Props {
  project: Project;
  onReload: () => void;
}

export default function FindInvestorsStep({ project, onReload }: Props) {
  const [recommendations, setRecommendations] = useState<
    { investor: Investor; score: number; reasons: string[] }[]
  >([]);
  const [aiMatches, setAiMatches] = useState<
    { id: string; score: number; reasons: string[] }[] | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mode, setMode] = useState<'local' | 'ai'>('local');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [allInvestors, setAllInvestors] = useState<Investor[]>([]);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawerInvestor, setDrawerInvestor] = useState<Investor | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const [recs, inv, pipe] = await Promise.all([
          getRecommendedInvestors(project.id, 20),
          getInvestors(),
          getPipeline(project.id),
        ]);
        setRecommendations(recs);
        setAllInvestors(inv);
        setPipelineCount(pipe.length);
        setAiMatches(null);
        setAddedIds(new Set());
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [project.id]);

  const handleAiMatch = async () => {
    setAiLoading(true);
    try {
      const pipelineIds = new Set((await getPipeline(project.id)).map((e) => e.investorId));
      const available = allInvestors.filter((i) => !pipelineIds.has(i.id));
      const res = await fetch('/api/match-investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, investors: available }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiMatches(data.matches || []);
        setMode('ai');
      } else {
        const err = await res.json();
        alert(err.error || 'AI matching failed. Make sure OPENAI_API_KEY is set.');
      }
    } catch {
      alert('Failed to connect to AI matching service.');
    }
    setAiLoading(false);
  };

  const handleAddToPipeline = async (investorId: string) => {
    await savePipelineEntry({
      id: uid(),
      projectId: project.id,
      investorId,
      stage: 'researching',
      notes: '',
      lastContact: '',
      nextFollowup: '',
      createdAt: new Date().toISOString(),
    });
    setAddedIds((prev) => { const next = new Set(Array.from(prev)); next.add(investorId); return next; });
    onReload();
  };

  const investorMap = new Map(allInvestors.map((i) => [i.id, i]));

  const displayList: { investor: Investor; score: number; reasons: string[] }[] =
    mode === 'ai' && aiMatches
      ? aiMatches
          .map((m) => {
            const inv = investorMap.get(m.id);
            return inv ? { investor: inv, score: m.score, reasons: m.reasons } : null;
          })
          .filter((x): x is { investor: Investor; score: number; reasons: string[] } => x !== null)
      : recommendations;

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const scoreLabel = (score: number) => {
    if (score >= 70) return 'Strong';
    if (score >= 40) return 'Good';
    return 'Possible';
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star size={14} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recommended Investors</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {loading ? 'Finding matches...' : `${displayList.length} match${displayList.length !== 1 ? 'es' : ''} found`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode('local')}
                className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  mode === 'local' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'
                }`}
              >
                <Tag size={11} className="inline mr-1" /> Tags
              </button>
              <button
                onClick={() => { if (aiMatches) setMode('ai'); else handleAiMatch(); }}
                disabled={aiLoading}
                className={`px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                  mode === 'ai' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'
                }`}
              >
                {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                AI Match
              </button>
            </div>
          </div>
        </div>

        <div className="mx-5 sm:mx-6 mt-4 mb-3 bg-indigo-50/60 rounded-lg px-3 py-2.5 text-xs text-indigo-600/80 flex items-start gap-2">
          <Sparkles size={12} className="flex-shrink-0 mt-0.5 text-indigo-400" />
          <span>
            {mode === 'local' ? (
              <>Matching based on <strong>stage</strong>, <strong>sectors</strong>, <strong>location</strong>, and <strong>check size</strong>.</>
            ) : (
              <>AI-powered matching using project description, investor profiles, and strategic fit analysis.</>
            )}
          </span>
        </div>

        <div className="p-5 sm:p-6 pt-2">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 size={24} className="mx-auto mb-2 text-indigo-300 animate-spin" />
              <p className="text-sm text-gray-400">Finding matches...</p>
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {allInvestors.length === 0
                  ? 'No investors in your database yet'
                  : pipelineCount > 0 && pipelineCount >= allInvestors.length
                  ? 'All investors are in your pipeline'
                  : 'No matching investors found'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                {allInvestors.length === 0
                  ? 'Import some from the Discover page to get started.'
                  : 'Try adding more sectors to your project or importing more investors.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {displayList.map(({ investor, score, reasons }) => {
                const isAdded = addedIds.has(investor.id);
                return (
                  <div
                    key={investor.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50 group transition-colors"
                  >
                    <div className={`flex-shrink-0 w-11 h-11 rounded-lg border flex flex-col items-center justify-center ${scoreColor(score)}`}>
                      <span className="text-sm font-bold leading-none">{score}</span>
                      <span className="text-[8px] uppercase tracking-wide mt-0.5 font-medium">{scoreLabel(score)}</span>
                    </div>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDrawerInvestor(investor)}>
                      <p className="text-sm font-medium text-gray-900 truncate">{investor.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {investor.role ? `${investor.role}, ` : ''}{investor.firm}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reasons.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-medium">{r}</span>
                        ))}
                      </div>
                    </div>

                    {investor.checkSize && (
                      <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 flex-shrink-0">
                        <DollarSign size={11} /> {investor.checkSize}
                      </div>
                    )}

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAdded ? (
                        <span className="px-2.5 py-1.5 text-[11px] text-emerald-600 bg-emerald-50 rounded-lg font-medium">Added</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAddToPipeline(investor.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-[11px] rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition-all"
                          >
                            <Plus size={11} /> Pipeline
                          </button>
                          <button
                            onClick={() => setDrawerInvestor(investor)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Send size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {drawerInvestor && (
        <InvestorDrawer
          investor={drawerInvestor}
          onClose={() => setDrawerInvestor(null)}
          onUpdate={() => { onReload(); }}
        />
      )}
    </>
  );
}
