'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, GripVertical, Calendar, Mail, Linkedin,
  Clock, DollarSign, Video, X, ArrowRight,
} from 'lucide-react';
import {
  PipelineStage,
  PipelineEntry,
  Investor,
  Activity,
  STAGE_LABELS,
  STAGE_COLORS,
} from '@/types';
import {
  getInvestors,
  getPipeline,
  savePipelineEntry,
  getProjects,
  getActivities,
  uid,
} from '@/lib/store';
import InvestorDrawer from './InvestorDrawer';

const PIPELINE_STAGES: PipelineStage[] = [
  'researching',
  'reached_out',
  'meeting',
  'pitch',
  'term_sheet',
  'closed',
  'passed',
];

export default function PipelinePage() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projectId, setProjectId] = useState('jeeb');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [addingTo, setAddingTo] = useState<PipelineStage | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<PipelineStage | null>(null);
  const [drawerEntry, setDrawerEntry] = useState<{ investor: Investor; entry: PipelineEntry } | null>(null);
  const [meetingModal, setMeetingModal] = useState<{ entryId: string; fromStage: PipelineStage } | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [activityCounts, setActivityCounts] = useState<Map<string, number>>(new Map());

  const reload = useCallback(async () => {
    const [pipe, inv, proj] = await Promise.all([
      getPipeline(projectId),
      getInvestors(),
      getProjects(),
    ]);
    setEntries(pipe);
    setInvestors(inv);
    setProjects(proj);

    // Fetch activity counts
    const counts = new Map<string, number>();
    await Promise.all(
      pipe.map(async (e) => {
        const acts = await getActivities(e.id);
        counts.set(e.id, acts.length);
      })
    );
    setActivityCounts(counts);
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const investorMap = new Map(investors.map((i) => [i.id, i]));

  const handleDragStart = (entryId: string) => setDragItem(entryId);

  const handleDrop = async (stage: PipelineStage) => {
    if (!dragItem) return;
    const entry = entries.find((e) => e.id === dragItem);
    if (entry && entry.stage !== stage) {
      if (stage === 'meeting') {
        setMeetingModal({ entryId: entry.id, fromStage: entry.stage });
        setMeetingDate('');
        setMeetingTime('10:00');
        setMeetingNotes('');
      } else {
        await savePipelineEntry({ ...entry, stage });
        reload();
      }
    }
    setDragItem(null);
    setDraggingOver(null);
  };

  const handleConfirmMeeting = async () => {
    if (!meetingModal) return;
    const entry = entries.find((e) => e.id === meetingModal.entryId);
    if (!entry) return;
    const dateTime = meetingDate && meetingTime
      ? `${meetingDate}T${meetingTime}`
      : meetingDate || '';
    await savePipelineEntry({
      ...entry,
      stage: 'meeting',
      meetingDate: dateTime,
      meetingNotes: meetingNotes,
      nextFollowup: meetingDate || entry.nextFollowup,
    });
    setMeetingModal(null);
    reload();
  };

  const handleSkipMeetingDate = async () => {
    if (!meetingModal) return;
    const entry = entries.find((e) => e.id === meetingModal.entryId);
    if (!entry) return;
    await savePipelineEntry({ ...entry, stage: 'meeting' });
    setMeetingModal(null);
    reload();
  };

  const handleAddToStage = async (stage: PipelineStage) => {
    if (!selectedInvestorId) return;
    const existing = entries.find(
      (e) => e.investorId === selectedInvestorId && e.projectId === projectId
    );
    if (existing) {
      alert('This investor is already in the pipeline for this project.');
      return;
    }
    const newEntry: PipelineEntry = {
      id: uid(),
      projectId,
      investorId: selectedInvestorId,
      stage,
      notes: '',
      lastContact: '',
      nextFollowup: '',
      createdAt: new Date().toISOString(),
    };
    await savePipelineEntry(newEntry);
    setAddingTo(null);
    setSelectedInvestorId('');
    reload();

    if (stage === 'meeting') {
      setMeetingModal({ entryId: newEntry.id, fromStage: stage });
      setMeetingDate('');
      setMeetingTime('10:00');
      setMeetingNotes('');
    }
  };

  const openDrawer = (entry: PipelineEntry) => {
    const inv = investorMap.get(entry.investorId);
    if (inv) {
      setDrawerEntry({ investor: inv, entry });
    }
  };

  const pipelineInvestorIds = new Set(entries.map((e) => e.investorId));
  const availableInvestors = investors.filter((i) => !pipelineInvestorIds.has(i.id));

  return (
    <div>
      {/* Project selector */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {entries.length} investor{entries.length !== 1 ? 's' : ''} in pipeline
        </span>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageEntries = entries.filter((e) => e.stage === stage);
          const isDragTarget = draggingOver === stage && dragItem;
          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-60 rounded-xl p-3 transition-colors ${
                isDragTarget ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDraggingOver(stage); }}
              onDragLeave={() => setDraggingOver(null)}
              onDrop={() => handleDrop(stage)}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${STAGE_COLORS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-gray-400">{stageEntries.length}</span>
              </div>

              <div className="space-y-2 kanban-col">
                {stageEntries.map((entry) => {
                  const inv = investorMap.get(entry.investorId);
                  if (!inv) return null;
                  const isOverdue =
                    entry.nextFollowup && new Date(entry.nextFollowup) < new Date();
                  const actCount = activityCounts.get(entry.id) || 0;

                  return (
                    <div
                      key={entry.id}
                      draggable
                      onDragStart={() => handleDragStart(entry.id)}
                      onClick={() => openDrawer(entry)}
                      className={`bg-white rounded-lg p-3 border shadow-sm cursor-pointer hover:shadow-md transition-shadow group ${
                        isOverdue ? 'border-red-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical
                          size={14}
                          className="text-gray-200 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inv.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {inv.role ? `${inv.role}, ` : ''}{inv.firm}
                          </p>

                          {inv.checkSize && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <DollarSign size={11} className="text-green-500" />
                              <p className="text-xs text-green-600">{inv.checkSize}</p>
                            </div>
                          )}

                          {entry.stage === 'meeting' && entry.meetingDate && (() => {
                            const md = new Date(entry.meetingDate);
                            const isPast = md < new Date();
                            const isToday = md.toDateString() === new Date().toDateString();
                            return (
                              <div className={`flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md text-xs font-medium ${
                                isToday ? 'bg-blue-50 text-blue-700' : isPast ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                                <Video size={12} />
                                <span>
                                  {isToday ? 'Today' : md.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {' '}at {md.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })()}

                          {entry.stage === 'meeting' && !entry.meetingDate && (
                            <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md text-xs bg-yellow-50 text-yellow-700">
                              <Calendar size={12} />
                              <span>No meeting scheduled</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                            {entry.stage !== 'meeting' && (
                              <div className="flex items-center gap-1">
                                <Calendar size={11} className={isOverdue ? 'text-red-400' : 'text-gray-300'} />
                                {entry.nextFollowup ? (
                                  <span className={`text-[11px] ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                    {new Date(entry.nextFollowup).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-300">No date</span>
                                )}
                              </div>
                            )}

                            {entry.stage === 'meeting' && entry.meetingDate && new Date(entry.meetingDate) < new Date() && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openDrawer(entry); }}
                                className="flex items-center gap-1 text-[11px] text-orange-600 font-medium hover:text-orange-700"
                              >
                                <ArrowRight size={10} />
                                Log &amp; advance
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 ml-auto">
                              {actCount > 0 && (
                                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                                  <Clock size={10} />
                                  {actCount}
                                </span>
                              )}
                              {inv.email && <Mail size={11} className="text-gray-300" />}
                              {inv.linkedin && <Linkedin size={11} className="text-gray-300" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add to stage */}
                {addingTo === stage ? (
                  <div className="bg-white rounded-lg p-2 border border-gray-200">
                    <select
                      value={selectedInvestorId}
                      onChange={(e) => setSelectedInvestorId(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded mb-2 outline-none"
                    >
                      <option value="">Select investor...</option>
                      {availableInvestors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} — {i.firm}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAddToStage(stage)}
                        className="flex-1 text-xs bg-gray-900 text-white py-1.5 rounded-md hover:bg-gray-800"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTo(null)}
                        className="text-xs text-gray-400 px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(stage)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-300 hover:text-gray-600 hover:bg-white hover:border-gray-200 border border-transparent rounded-lg transition-all"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meeting Schedule Modal */}
      {meetingModal && (() => {
        const entry = entries.find((e) => e.id === meetingModal.entryId);
        const inv = entry ? investorMap.get(entry.investorId) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMeetingModal(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Schedule Meeting</h3>
                  {inv && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      with {inv.name}{inv.firm ? ` at ${inv.firm}` : ''}
                    </p>
                  )}
                </div>
                <button onClick={() => setMeetingModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wide">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wide">Meeting Notes (optional)</label>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Zoom link, agenda, topics to discuss..."
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleConfirmMeeting}
                  disabled={!meetingDate}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Calendar size={14} />
                  Schedule Meeting
                </button>
                <button
                  onClick={handleSkipMeetingDate}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Investor Drawer */}
      {drawerEntry && (
        <InvestorDrawer
          investor={drawerEntry.investor}
          pipelineEntry={drawerEntry.entry}
          onClose={() => setDrawerEntry(null)}
          onUpdate={async () => {
            await reload();
            const updatedPipe = await getPipeline(projectId);
            const updated = updatedPipe.find((e) => e.id === drawerEntry.entry.id);
            const updatedInv = (await getInvestors()).find((i) => i.id === drawerEntry.investor.id);
            if (updated && updatedInv) {
              setDrawerEntry({ investor: updatedInv, entry: updated });
            }
          }}
        />
      )}
    </div>
  );
}
