'use client';

import { useState, useEffect } from 'react';
import {
  X, Mail, Linkedin, Phone, StickyNote, Calendar, Send, Copy,
  Check, Clock, MapPin, DollarSign,
  Briefcase, Tag, Globe, ArrowRight, Plus, Paperclip, FileText,
  Video, AlertCircle, Snowflake, Handshake, Reply, CalendarCheck, HeartHandshake,
  PenLine, Sparkles, Loader2, Zap, Target, Shield, MessageCircle, Lightbulb,
  RefreshCw, AlertTriangle,
} from 'lucide-react';
import ProjectLogo from './ProjectLogo';
import {
  Investor, PipelineEntry, Activity, Project, PipelineStage,
  STAGE_LABELS, STAGE_COLORS, DEFAULT_EMAIL_TEMPLATES, EmailTemplate,
  CommitStatus, COMMIT_STATUS_LABELS, COMMIT_STATUS_COLORS, FeedbackEntry,
} from '@/types';
import {
  saveActivity, getActivities, savePipelineEntry, getPipeline, getProjects, uid,
} from '@/lib/store';

interface Props {
  investor: Investor;
  pipelineEntry?: PipelineEntry;
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'profile' | 'standout' | 'outreach' | 'activity';

export default function InvestorDrawer({ investor, pipelineEntry: initialEntry, onClose, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelineEntry, setPipelineEntry] = useState<PipelineEntry | undefined>(initialEntry);

  useEffect(() => {
    (async () => {
      const proj = await getProjects();
      setProjects(proj);
      if (!initialEntry) {
        const allPipeline = await getPipeline();
        const existing = allPipeline.find((e) => e.investorId === investor.id);
        if (existing) setPipelineEntry(existing);
      }
    })();
  }, [initialEntry, investor.id]);

  useEffect(() => {
    if (pipelineEntry) {
      getActivities(pipelineEntry.id).then(setActivities);
    }
  }, [pipelineEntry]);

  const project = projects.find((p) => p.id === pipelineEntry?.projectId);

  const reloadActivities = async () => {
    if (pipelineEntry) {
      const acts = await getActivities(pipelineEntry.id);
      setActivities(acts);
    }
  };

  const addToPipeline = async (projectId: string, stage: PipelineStage = 'researching'): Promise<PipelineEntry> => {
    const entry: PipelineEntry = {
      id: uid(),
      projectId,
      investorId: investor.id,
      stage,
      notes: '',
      lastContact: '',
      nextFollowup: '',
      createdAt: new Date().toISOString(),
    };
    await savePipelineEntry(entry);
    setPipelineEntry(entry);
    onUpdate();
    return entry;
  };

  const handleLogActivity = async (type: Activity['type'], notes: string, subject?: string) => {
    let entry = pipelineEntry;
    if (!entry && projects.length > 0) {
      entry = await addToPipeline(projects[0].id, 'reached_out');
    }
    if (!entry) return;

    await saveActivity({
      id: uid(),
      pipelineId: entry.id,
      type,
      date: new Date().toISOString(),
      notes,
      subject,
    });
    await savePipelineEntry({
      ...entry,
      lastContact: new Date().toISOString(),
    });
    await reloadActivities();
    onUpdate();
  };

  const handleMoveStage = async (stage: PipelineStage) => {
    if (!pipelineEntry) return;
    const updated = { ...pipelineEntry, stage };
    await savePipelineEntry(updated);
    setPipelineEntry(updated);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex md:justify-end items-end md:items-stretch">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-h-[92vh] md:max-h-full md:max-w-lg bg-white shadow-xl md:border-l border-gray-200/60 flex flex-col rounded-t-2xl md:rounded-none">
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>
        {/* Header */}
        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">{investor.name}</h2>
              <p className="text-sm text-gray-500 truncate">
                {investor.role ? `${investor.role} at ` : ''}{investor.firm}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {pipelineEntry ? (
                  <>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STAGE_COLORS[pipelineEntry.stage as PipelineStage]}`}>
                      {STAGE_LABELS[pipelineEntry.stage as PipelineStage]}
                    </span>
                    {project && (
                      <span className="text-[11px] text-gray-400">for {project.name}</span>
                    )}
                  </>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-50 text-yellow-700">
                    Not in pipeline
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-3 md:mt-4 flex-wrap">
            {investor.email && (
              <a
                href={`mailto:${investor.email}`}
                className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800"
              >
                <Mail size={12} />
                Email
              </a>
            )}
            {investor.linkedin && (
              <a
                href={investor.linkedin.startsWith('http') ? investor.linkedin : `https://linkedin.com/in/${investor.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-md hover:bg-gray-50"
              >
                <Linkedin size={12} />
                LinkedIn
              </a>
            )}
            <button
              onClick={() => setTab('outreach')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800"
            >
              <PenLine size={12} />
              Compose
            </button>

            <div className="ml-auto flex items-center gap-2">
              {!pipelineEntry && projects.length > 0 && (
                <AddToPipelineButton projects={projects} onAdd={addToPipeline} />
              )}
              {pipelineEntry && pipelineEntry.stage === 'researching' && (
                <button
                  onClick={() => handleMoveStage('reached_out')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-700 text-xs rounded-lg hover:bg-green-50"
                >
                  <ArrowRight size={12} />
                  Mark Reached Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 overflow-x-auto scrollbar-hide">
          {([
            { key: 'profile' as Tab, label: 'Profile' },
            { key: 'standout' as Tab, label: 'Stand Out' },
            { key: 'outreach' as Tab, label: 'Outreach' },
            { key: 'activity' as Tab, label: `Activity${activities.length ? ` (${activities.length})` : ''}` },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'profile' && (
            <ProfileTab investor={investor} pipelineEntry={pipelineEntry} project={project} onUpdate={onUpdate} onMoveStage={handleMoveStage} />
          )}
          {tab === 'standout' && (
            <StandOutTab investor={investor} project={project} />
          )}
          {tab === 'outreach' && (
            <OutreachTab
              investor={investor}
              project={project}
              projects={projects}
              pipelineEntry={pipelineEntry}
              onLogActivity={handleLogActivity}
              onMoveStage={handleMoveStage}
              onAddToPipeline={addToPipeline}
            />
          )}
          {tab === 'activity' && (
            <ActivityTab
              activities={activities}
              pipelineEntry={pipelineEntry}
              onLogActivity={handleLogActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add to Pipeline Button ──────────────────────────────────────

function AddToPipelineButton({
  projects,
  onAdd,
}: {
  projects: Project[];
  onAdd: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (projects.length === 1) {
    return (
      <button
        onClick={() => onAdd(projects[0].id)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
      >
        <Plus size={12} />
        Add to {projects[0].name}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
      >
        <Plus size={12} />
        Add to Pipeline
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAdd(p.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <ProjectLogo logoUrl={p.logoUrl} name={p.name} size="xs" />
              <span>{p.name} ({p.stage})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stand Out Tab ──────────────────────────────────────────────────

interface IntelData {
  intelBrief: {
    thesis: string;
    recentDeals: { company: string; why: string }[];
    publicInsights: string[];
    alignmentPoints: string[];
    concerns: string[];
  };
  warmIntroBlurb: string;
  approachStrategy: {
    bestChannel: string;
    timing: string;
    leadWith: string;
    avoid: string;
    attentionHook: string;
  };
}

function StandOutTab({ investor, project }: { investor: Investor; project?: Project }) {
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedBlurb, setCopiedBlurb] = useState(false);
  const [copiedHook, setCopiedHook] = useState(false);

  const generateIntel = async () => {
    if (!project) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/investor-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investor, project }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setIntel(data);
    } catch {
      setError('Failed to generate intel. Please try again.');
    }
    setLoading(false);
  };

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!project) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Zap size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Add to pipeline first</p>
        <p className="text-xs text-gray-400 mt-1">Stand Out intel requires a project context</p>
      </div>
    );
  }

  if (!intel && !loading) {
    return (
      <div className="p-6">
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Stand Out to {investor.name}</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mb-5">
            Get AI-powered intel, a warm intro blurb, and the best approach strategy for this investor.
          </p>
          <button
            onClick={generateIntel}
            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}
          >
            <Sparkles size={15} />
            Generate Intel
          </button>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center py-10">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">Researching {investor.name}...</p>
          <p className="text-xs text-gray-400 mt-1">Analyzing thesis, portfolio, and approach angles</p>
        </div>
      </div>
    );
  }

  if (!intel) return null;

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Regenerate button */}
      <div className="flex justify-end">
        <button
          onClick={generateIntel}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
      </div>

      {/* ── Intel Brief ── */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Target size={14} className="text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Investor Intel</h4>
        </div>

        {/* Thesis */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Thesis</p>
          <p className="text-xs text-gray-700 leading-relaxed">{intel.intelBrief.thesis}</p>
        </div>

        {/* Recent Deals */}
        {intel.intelBrief.recentDeals.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">Recent Deals</p>
            <div className="space-y-1.5">
              {intel.intelBrief.recentDeals.map((deal, i) => (
                <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-100">
                  <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase size={10} className="text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900">{deal.company}</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{deal.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public Insights */}
        {intel.intelBrief.publicInsights.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">Public Insights</p>
            <div className="space-y-1">
              {intel.intelBrief.publicInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2">
                  <MessageCircle size={11} className="text-gray-300 flex-shrink-0 mt-1" />
                  <p className="text-xs text-gray-600 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alignment Points */}
        {intel.intelBrief.alignmentPoints.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-semibold mb-1.5">Why You Fit</p>
            <div className="space-y-1">
              {intel.intelBrief.alignmentPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {intel.intelBrief.concerns.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-amber-500 font-semibold mb-1.5">Prepare For</p>
            <div className="space-y-1">
              {intel.intelBrief.concerns.map((concern, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={11} className="text-amber-400 flex-shrink-0 mt-1" />
                  <p className="text-xs text-gray-600 leading-relaxed">{concern}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Warm Intro Blurb ── */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Handshake size={14} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Warm Intro Blurb</h4>
              <p className="text-[10px] text-gray-400">Forward this to a mutual connection</p>
            </div>
          </div>
          <button
            onClick={() => copyText(intel.warmIntroBlurb, setCopiedBlurb)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copiedBlurb ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
            }`}
          >
            {copiedBlurb ? <Check size={11} /> : <Copy size={11} />}
            {copiedBlurb ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="bg-white rounded-lg p-3.5 border border-indigo-100/50">
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{intel.warmIntroBlurb}</p>
        </div>
      </div>

      {/* ── Approach Strategy ── */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Lightbulb size={14} className="text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Approach Strategy</h4>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Best Channel</p>
            <p className="text-xs font-medium text-gray-900">{intel.approachStrategy.bestChannel}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Timing</p>
            <p className="text-xs font-medium text-gray-900">{intel.approachStrategy.timing}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold mb-1">Lead With</p>
          <p className="text-xs text-gray-700 leading-relaxed">{intel.approachStrategy.leadWith}</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-red-50">
          <p className="text-[10px] uppercase tracking-widest text-red-400 font-semibold mb-1">Avoid</p>
          <p className="text-xs text-gray-700 leading-relaxed">{intel.approachStrategy.avoid}</p>
        </div>

        {/* Attention Hook — prominent */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-white/70" />
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Attention Hook</p>
            </div>
            <button
              onClick={() => copyText(intel.approachStrategy.attentionHook, setCopiedHook)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                copiedHook ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {copiedHook ? <Check size={10} /> : <Copy size={10} />}
              {copiedHook ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{intel.approachStrategy.attentionHook}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>
      )}
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────

function ProfileTab({
  investor,
  pipelineEntry,
  project,
  onUpdate,
  onMoveStage,
}: {
  investor: Investor;
  pipelineEntry?: PipelineEntry;
  project?: Project;
  onUpdate: () => void;
  onMoveStage: (stage: PipelineStage) => void;
}) {
  const fields = [
    { icon: <Briefcase size={14} />, label: 'Firm', value: investor.firm },
    { icon: <Tag size={14} />, label: 'Role', value: investor.role },
    { icon: <Mail size={14} />, label: 'Email', value: investor.email },
    { icon: <Linkedin size={14} />, label: 'LinkedIn', value: investor.linkedin },
    { icon: <DollarSign size={14} />, label: 'Check Size', value: investor.checkSize },
    { icon: <Tag size={14} />, label: 'Stage', value: investor.stage },
    { icon: <MapPin size={14} />, label: 'Location', value: investor.location },
    { icon: <Globe size={14} />, label: 'Website', value: investor.website },
    { icon: <StickyNote size={14} />, label: 'Intro Path', value: investor.introPath },
    { icon: <Tag size={14} />, label: 'Source', value: investor.source },
  ];

  const [notes, setNotes] = useState(pipelineEntry?.notes || '');
  const [followup, setFollowup] = useState(pipelineEntry?.nextFollowup?.split('T')[0] || '');
  const [commitAmount, setCommitAmount] = useState(pipelineEntry?.commitAmount || '');
  const [commitStatus, setCommitStatus] = useState<CommitStatus>((pipelineEntry?.commitStatus as CommitStatus) || '');
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>(() => {
    try { return pipelineEntry?.feedback ? JSON.parse(pipelineEntry.feedback) : []; } catch { return []; }
  });
  const [newFeedback, setNewFeedback] = useState('');
  const [newSentiment, setNewSentiment] = useState<FeedbackEntry['sentiment']>('neutral');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [mtgDate, setMtgDate] = useState(pipelineEntry?.meetingDate?.split('T')[0] || '');
  const [mtgTime, setMtgTime] = useState(() => {
    if (pipelineEntry?.meetingDate && pipelineEntry.meetingDate.includes('T')) {
      return pipelineEntry.meetingDate.split('T')[1]?.slice(0, 5) || '10:00';
    }
    return '10:00';
  });
  const [mtgNotes, setMtgNotes] = useState(pipelineEntry?.meetingNotes || '');

  const isMeetingStage = pipelineEntry?.stage === 'meeting';
  const meetingDateTime = pipelineEntry?.meetingDate ? new Date(pipelineEntry.meetingDate) : null;
  const meetingIsPast = meetingDateTime ? meetingDateTime < new Date() : false;
  const meetingIsToday = meetingDateTime ? meetingDateTime.toDateString() === new Date().toDateString() : false;

  const handleSaveNotes = async () => {
    if (!pipelineEntry) return;
    await savePipelineEntry({ ...pipelineEntry, notes });
    onUpdate();
  };

  const handleSaveFollowup = async (date: string) => {
    if (!pipelineEntry) return;
    setFollowup(date);
    await savePipelineEntry({ ...pipelineEntry, nextFollowup: date });
    onUpdate();
  };

  const handleSaveMeeting = async () => {
    if (!pipelineEntry) return;
    const dateTime = mtgDate && mtgTime ? `${mtgDate}T${mtgTime}` : mtgDate || '';
    await savePipelineEntry({
      ...pipelineEntry,
      meetingDate: dateTime,
      meetingNotes: mtgNotes,
      nextFollowup: mtgDate || pipelineEntry.nextFollowup,
    });
    onUpdate();
  };

  return (
    <div className="p-5 space-y-5">
      {/* Meeting Section */}
      {isMeetingStage && (
        <div className={`rounded-xl p-4 border ${
          meetingIsToday ? 'bg-blue-50 border-blue-200' : meetingIsPast ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Video size={16} className={meetingIsToday ? 'text-blue-600' : meetingIsPast ? 'text-orange-600' : 'text-purple-600'} />
            <h3 className={`text-sm font-semibold ${meetingIsToday ? 'text-blue-900' : meetingIsPast ? 'text-orange-900' : 'text-purple-900'}`}>
              {meetingIsToday ? 'Meeting Today' : meetingIsPast ? 'Meeting Completed' : meetingDateTime ? 'Upcoming Meeting' : 'Schedule Meeting'}
            </h3>
          </div>

          {meetingDateTime && (
            <div className={`text-sm font-medium mb-3 ${meetingIsToday ? 'text-blue-800' : meetingIsPast ? 'text-orange-800' : 'text-purple-800'}`}>
              {meetingDateTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' at '}
              {meetingDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Date</label>
              <input
                type="date"
                value={mtgDate}
                onChange={(e) => setMtgDate(e.target.value)}
                onBlur={handleSaveMeeting}
                className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Time</label>
              <input
                type="time"
                value={mtgTime}
                onChange={(e) => setMtgTime(e.target.value)}
                onBlur={handleSaveMeeting}
                className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase">Agenda / Notes</label>
            <textarea
              value={mtgNotes}
              onChange={(e) => setMtgNotes(e.target.value)}
              onBlur={handleSaveMeeting}
              placeholder="Zoom link, topics to discuss, prep notes..."
              rows={2}
              className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none resize-none bg-white"
            />
          </div>

          {(investor.checkSize || investor.sectors.length > 0 || project) && (
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Meeting Prep</p>
              <div className="space-y-1.5 text-xs">
                {investor.checkSize && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <DollarSign size={11} className="text-green-500" />
                    Check size: {investor.checkSize}
                  </div>
                )}
                {investor.sectors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Tag size={11} className="text-blue-500" />
                    Focus: {investor.sectors.slice(0, 4).join(', ')}
                  </div>
                )}
                {project?.deckUrl && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <FileText size={11} className="text-purple-500" />
                    <a href={project.deckUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Open Pitch Deck
                    </a>
                  </div>
                )}
                {project?.website && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Globe size={11} className="text-gray-500" />
                    <a href={project.website.startsWith('http') ? project.website : `https://${project.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {project.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {meetingIsPast && (
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={12} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-800">Meeting has passed — what&apos;s next?</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onMoveStage('pitch')}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
                >
                  <ArrowRight size={12} />
                  Move to Pitch
                </button>
                <button
                  onClick={() => onMoveStage('passed')}
                  className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Passed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {fields.filter((f) => f.value).map((f) => (
          <div key={f.label} className="flex items-start gap-3">
            <div className="text-gray-400 mt-0.5">{f.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">{f.label}</p>
              {f.label === 'Email' ? (
                <a href={`mailto:${f.value}`} className="text-sm text-blue-600 hover:underline break-all">{f.value}</a>
              ) : f.label === 'LinkedIn' || f.label === 'Website' ? (
                <a href={f.value!.startsWith('http') ? f.value! : `https://${f.value}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {f.value}
                </a>
              ) : (
                <p className="text-sm text-gray-900">{f.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {investor.sectors.length > 0 && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">Sectors</p>
          <div className="flex flex-wrap gap-1.5">
            {investor.sectors.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      {pipelineEntry && !isMeetingStage && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">Next Follow-up</p>
          <input
            type="date"
            value={followup}
            onChange={(e) => handleSaveFollowup(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-full"
          />
        </div>
      )}

      {pipelineEntry && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">Pipeline Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            rows={3}
            placeholder="Add notes about this investor..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none"
          />
        </div>
      )}

      {/* Commitment Tracking */}
      {pipelineEntry && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Commitment</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Amount</label>
              <input
                type="text"
                value={commitAmount}
                onChange={(e) => setCommitAmount(e.target.value)}
                onBlur={async () => {
                  if (!pipelineEntry) return;
                  await savePipelineEntry({ ...pipelineEntry, commitAmount });
                  onUpdate();
                }}
                placeholder="$500K"
                className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Status</label>
              <select
                value={commitStatus}
                onChange={async (e) => {
                  const val = e.target.value as CommitStatus;
                  setCommitStatus(val);
                  if (!pipelineEntry) return;
                  await savePipelineEntry({ ...pipelineEntry, commitStatus: val });
                  onUpdate();
                }}
                className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white"
              >
                {Object.entries(COMMIT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          {commitStatus ? (
            <div className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${COMMIT_STATUS_COLORS[commitStatus]}`}>
              {COMMIT_STATUS_LABELS[commitStatus]}
              {commitAmount && ` · ${commitAmount}`}
            </div>
          ) : null}
        </div>
      )}

      {/* Pitch Feedback */}
      {pipelineEntry && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Pitch Feedback</p>
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showFeedbackForm ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showFeedbackForm && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
              <div className="flex gap-1">
                {(['positive', 'neutral', 'concern'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewSentiment(s)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                      newSentiment === s
                        ? s === 'positive' ? 'bg-green-100 text-green-700'
                          : s === 'concern' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-700'
                        : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    {s === 'positive' ? 'Liked' : s === 'concern' ? 'Concern' : 'Neutral'}
                  </button>
                ))}
              </div>
              <textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder={newSentiment === 'positive' ? 'What did they like?' : newSentiment === 'concern' ? 'What was the concern?' : 'What was their feedback?'}
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none resize-none bg-white"
              />
              <button
                onClick={async () => {
                  if (!newFeedback.trim() || !pipelineEntry) return;
                  const entry: FeedbackEntry = {
                    id: uid(),
                    date: new Date().toISOString(),
                    sentiment: newSentiment,
                    text: newFeedback.trim(),
                  };
                  const updated = [entry, ...feedbackList];
                  setFeedbackList(updated);
                  setNewFeedback('');
                  setShowFeedbackForm(false);
                  await savePipelineEntry({ ...pipelineEntry, feedback: JSON.stringify(updated) });
                  onUpdate();
                }}
                className="w-full py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
              >
                Save Feedback
              </button>
            </div>
          )}

          {feedbackList.length === 0 && !showFeedbackForm ? (
            <p className="text-xs text-gray-300">No feedback logged yet</p>
          ) : (
            <div className="space-y-2">
              {feedbackList.map((fb) => (
                <div key={fb.id} className={`rounded-lg px-3 py-2 border ${
                  fb.sentiment === 'positive' ? 'bg-green-50/50 border-green-100'
                    : fb.sentiment === 'concern' ? 'bg-red-50/50 border-red-100'
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      fb.sentiment === 'positive' ? 'text-green-600'
                        : fb.sentiment === 'concern' ? 'text-red-500'
                        : 'text-gray-500'
                    }`}>
                      {fb.sentiment === 'positive' ? 'Liked' : fb.sentiment === 'concern' ? 'Concern' : 'Note'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(fb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{fb.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {investor.notes && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">Investor Notes</p>
          <p className="text-sm text-gray-600">{investor.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Outreach Tab ────────────────────────────────────────────────

function OutreachTab({
  investor,
  project,
  projects,
  pipelineEntry,
  onLogActivity,
  onMoveStage,
  onAddToPipeline,
}: {
  investor: Investor;
  project?: Project;
  projects: Project[];
  pipelineEntry?: PipelineEntry;
  onLogActivity: (type: Activity['type'], notes: string, subject?: string) => void;
  onMoveStage: (stage: PipelineStage) => void;
  onAddToPipeline: (projectId: string, stage?: PipelineStage) => Promise<PipelineEntry>;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(DEFAULT_EMAIL_TEMPLATES[0]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(project?.id || projects[0]?.id || '');
  const [personalizing, setPersonalizing] = useState(false);
  const [researchNotes, setResearchNotes] = useState('');

  const activeProject = project || projects.find((p) => p.id === selectedProjectId);

  const mergeFields: Record<string, string> = {
    '{{investor_name}}': investor.name.split(' ')[0],
    '{{investor_full_name}}': investor.name,
    '{{firm}}': investor.firm,
    '{{sectors}}': investor.sectors.slice(0, 3).join(', ') || 'your space',
    '{{stage}}': activeProject?.stage || investor.stage || 'Seed',
    '{{project_name}}': activeProject?.name || '[Project Name]',
    '{{project_description}}': activeProject?.description || '[Brief description]',
    '{{raise_amount}}': activeProject?.raiseAmount || '[Amount]',
    '{{sender_name}}': '[Your Name]',
    '{{mutual_connection}}': '[Mutual Connection]',
    '{{meeting_date}}': pipelineEntry?.meetingDate
      ? new Date(pipelineEntry.meetingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : '[Meeting Date]',
  };

  const buildAttachmentsBlock = (): string => {
    if (!activeProject) return '';
    const lines: string[] = [];

    if (activeProject.website) {
      lines.push(`Website: ${activeProject.website}`);
    }
    if (activeProject.deckUrl) {
      lines.push(`Pitch Deck: ${activeProject.deckUrl}`);
    }
    const shareableFiles = activeProject.files?.filter(
      (f) => f.dataUrl && !f.dataUrl.startsWith('data:')
    ) || [];
    for (const file of shareableFiles) {
      lines.push(`${file.name}: ${file.dataUrl}`);
    }

    if (lines.length === 0) return '';
    return '\n\n---\n' + lines.join('\n');
  };

  const applyTemplate = (tmpl: EmailTemplate) => {
    setSelectedTemplate(tmpl);
    let s = tmpl.subject;
    let b = tmpl.body;
    for (const [key, val] of Object.entries(mergeFields)) {
      s = s.split(key).join(val);
      b = b.split(key).join(val);
    }
    b += buildAttachmentsBlock();
    setSubject(s);
    setBody(b);
    setSent(false);
    setCopied(false);
  };

  useEffect(() => {
    applyTemplate(DEFAULT_EMAIL_TEMPLATES[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkSent = async () => {
    if (!pipelineEntry && selectedProjectId) {
      await onAddToPipeline(selectedProjectId, 'reached_out');
    }
    onLogActivity('email', body, subject);
    if (pipelineEntry?.stage === 'researching') {
      onMoveStage('reached_out');
    }
    setSent(true);
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(investor.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handlePersonalize = async () => {
    setPersonalizing(true);
    setResearchNotes('');
    try {
      const res = await fetch('/api/personalize-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor: {
            name: investor.name,
            firm: investor.firm,
            role: investor.role,
            sectors: investor.sectors,
            checkSize: investor.checkSize,
          },
          project: activeProject ? {
            name: activeProject.name,
            description: activeProject.description,
            stage: activeProject.stage,
            sectors: activeProject.sectors,
            raiseAmount: activeProject.raiseAmount,
            website: activeProject.website,
          } : undefined,
          templateType: selectedTemplate.name,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        if (data.subject) setSubject(data.subject);
        if (data.body) setBody(data.body + buildAttachmentsBlock());
        if (data.researchNotes) setResearchNotes(data.researchNotes);
      }
    } catch (err) {
      alert('Failed to personalize: ' + String(err));
    } finally {
      setPersonalizing(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      {sent ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <Check size={24} className="text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Outreach logged</h3>
          <p className="text-xs text-gray-500">
            Email to {investor.name} recorded and added to pipeline.
          </p>
          <button
            onClick={() => { setSent(false); applyTemplate(DEFAULT_EMAIL_TEMPLATES[2]); }}
            className="mt-4 px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Draft Follow-up
          </button>
        </div>
      ) : (
        <>
          {!pipelineEntry && projects.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <p className="text-xs text-yellow-800 mb-2">
                This investor is not in any pipeline yet. Select a project — they&apos;ll be auto-added when you log the email.
              </p>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-2 py-1.5 border border-yellow-200 rounded text-xs outline-none bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
                ))}
              </select>
            </div>
          )}

          {/* Research checklist */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Research before sending</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {[
                { text: `Google "${investor.name} podcast"`, href: `https://www.google.com/search?q=${encodeURIComponent(investor.name + ' podcast')}` },
                { text: 'Check their Twitter/X', href: `https://www.google.com/search?q=${encodeURIComponent(investor.name + ' ' + investor.firm + ' twitter')}` },
                { text: `${investor.firm} recent deals`, href: `https://www.google.com/search?q=${encodeURIComponent(investor.firm + ' investments 2024 2025')}` },
                { text: 'Lead or follow?', href: `https://www.google.com/search?q=${encodeURIComponent(investor.firm + ' lead investor rounds')}` },
              ].map((item) => (
                <a
                  key={item.text}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-gray-500 hover:text-gray-800 truncate"
                >
                  <span className="text-gray-300 mr-1">&rarr;</span>
                  {item.text}
                </a>
              ))}
            </div>
          </div>

          {/* Template picker */}
          <div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
              {DEFAULT_EMAIL_TEMPLATES.map((tmpl) => {
                const isActive = selectedTemplate.id === tmpl.id;
                const iconMap: Record<string, React.ReactNode> = {
                  'snowflake': <Snowflake size={14} />,
                  'handshake': <Handshake size={14} />,
                  'reply': <Reply size={14} />,
                  'calendar-check': <CalendarCheck size={14} />,
                  'heart-handshake': <HeartHandshake size={14} />,
                };
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-center transition-all min-w-[72px] ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>
                      {iconMap[tmpl.icon] || <Mail size={14} />}
                    </span>
                    <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                      {tmpl.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Personalize */}
          <button
            onClick={handlePersonalize}
            disabled={personalizing}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              personalizing
                ? 'bg-gray-100 text-gray-400 cursor-wait'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {personalizing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Researching {investor.name}...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Personalize with AI
              </>
            )}
          </button>

          {researchNotes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-1">AI Research Notes</p>
              <p className="text-xs text-amber-800 leading-relaxed">{researchNotes}</p>
            </div>
          )}

          {/* Attached materials */}
          {activeProject && (activeProject.website || activeProject.deckUrl || (activeProject.files && activeProject.files.length > 0)) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Paperclip size={11} />
                Included in message
              </p>
              <div className="space-y-1.5">
                {activeProject.website && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Globe size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{activeProject.website}</span>
                  </div>
                )}
                {activeProject.deckUrl && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FileText size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">Pitch Deck: {activeProject.deckUrl}</span>
                  </div>
                )}
                {activeProject.files?.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-xs text-gray-600">
                    <Paperclip size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{f.name} ({f.type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email compose card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* To */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-400 w-10 flex-shrink-0">To</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-800">
                  <span className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0">
                    {investor.name.charAt(0)}
                  </span>
                  {investor.name}
                </span>
                {investor.email ? (
                  <span className="text-[11px] text-gray-400 truncate">{investor.email}</span>
                ) : (
                  <span className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle size={10} />
                    No email on file
                  </span>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
              <span className="text-xs text-gray-400 w-10 flex-shrink-0">Subj</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-300"
                placeholder="Email subject..."
              />
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 text-sm text-gray-800 outline-none resize-none leading-relaxed bg-white"
              placeholder="Write your message..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {investor.email && (
              <button
                onClick={handleOpenGmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
              >
                <Send size={14} />
                Open in Gmail
              </button>
            )}
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 border text-sm rounded-lg transition-all ${
                copied
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleMarkSent}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              <Check size={14} />
              Log Sent
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Activity Tab ────────────────────────────────────────────────

function ActivityTab({
  activities,
  pipelineEntry,
  onLogActivity,
}: {
  activities: Activity[];
  pipelineEntry?: PipelineEntry;
  onLogActivity: (type: Activity['type'], notes: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [actType, setActType] = useState<Activity['type']>('note');
  const [actNote, setActNote] = useState('');

  const handleAdd = () => {
    if (!actNote.trim()) return;
    onLogActivity(actType, actNote);
    setActNote('');
    setShowAdd(false);
  };

  const typeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'email': return <Mail size={14} className="text-blue-500" />;
      case 'meeting': return <Calendar size={14} className="text-purple-500" />;
      case 'call': return <Phone size={14} className="text-green-500" />;
      case 'linkedin': return <Linkedin size={14} className="text-blue-600" />;
      case 'note': return <StickyNote size={14} className="text-yellow-500" />;
    }
  };

  const typeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'email': return 'Email sent';
      case 'meeting': return 'Meeting';
      case 'call': return 'Phone call';
      case 'linkedin': return 'LinkedIn message';
      case 'note': return 'Note';
    }
  };

  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-5">
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 mb-4"
        >
          + Log Activity
        </button>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {(['email', 'call', 'meeting', 'linkedin', 'note'] as Activity['type'][]).map((t) => (
              <button
                key={t}
                onClick={() => setActType(t)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  actType === t
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {typeIcon(t)}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            value={actNote}
            onChange={(e) => setActNote(e.target.value)}
            placeholder="What happened?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800">
              Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-8">
          <Clock size={24} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">No activity yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Log your first touchpoint above</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-gray-100" />
          <div className="space-y-4">
            {sorted.map((act) => {
              const date = new Date(act.date);
              const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
              let timeAgo = '';
              if (diffDays === 0) timeAgo = 'Today';
              else if (diffDays === 1) timeAgo = 'Yesterday';
              else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
              else timeAgo = date.toLocaleDateString();

              return (
                <div key={act.id} className="flex gap-3 relative">
                  <div className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    {typeIcon(act.type)}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{typeLabel(act.type)}</span>
                      <span className="text-[11px] text-gray-400">{timeAgo}</span>
                    </div>
                    {act.subject && (
                      <p className="text-xs text-gray-500 mt-0.5">Re: {act.subject}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-3">{act.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
