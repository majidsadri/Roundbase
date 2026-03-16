'use client';

import { useState, useEffect } from 'react';
import {
  X, Mail, Linkedin, Phone, StickyNote, Calendar, Send, Copy,
  Check, Clock, MapPin, DollarSign,
  Briefcase, Tag, Globe, ArrowRight, Plus, Paperclip, FileText,
  Video, AlertCircle, Snowflake, Handshake, Reply, CalendarCheck, HeartHandshake,
  PenLine,
} from 'lucide-react';
import ProjectLogo from './ProjectLogo';
import {
  Investor, PipelineEntry, Activity, Project, PipelineStage,
  STAGE_LABELS, STAGE_COLORS, DEFAULT_EMAIL_TEMPLATES, EmailTemplate,
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

type Tab = 'profile' | 'outreach' | 'activity';

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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-xl border-l border-gray-200/60 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
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
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {investor.email && (
              <a
                href={`mailto:${investor.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800"
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
        <div className="flex border-b border-gray-100 px-6">
          {([
            { key: 'profile' as Tab, label: 'Profile' },
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
