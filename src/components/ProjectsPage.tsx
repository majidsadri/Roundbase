'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit2, FolderOpen, Upload, Trash2, FileText, X,
  Download, DollarSign, MapPin, Globe, Tag,
  Sparkles, ArrowRight, Send, Loader2, Users, Star,
} from 'lucide-react';
import { Project, ProjectFile, Investor } from '@/types';
import {
  getProjects, saveProject, uid, getPipeline, getInvestors,
  getRecommendedInvestors, savePipelineEntry, uploadFile, deleteFile,
} from '@/lib/store';
import InvestorDrawer from './InvestorDrawer';

const FILE_TYPES = [
  { value: 'deck', label: 'Pitch Deck' },
  { value: 'pitch', label: 'Pitch Video' },
  { value: 'onepager', label: 'One-Pager' },
  { value: 'financials', label: 'Financials' },
  { value: 'other', label: 'Other' },
] as const;

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

interface ProjectForm {
  name: string;
  description: string;
  stage: string;
  deckUrl: string;
  raiseAmount: string;
  targetInvestors: string;
  sectors: string;
  location: string;
  website: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>({
    name: '', description: '', stage: 'Pre-Seed', deckUrl: '',
    raiseAmount: '', targetInvestors: '', sectors: '', location: '', website: '',
  });
  const [pendingFiles, setPendingFiles] = useState<{ file: File; type: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFileType, setUploadFileType] = useState('deck');
  const [drawerInvestor, setDrawerInvestor] = useState<Investor | null>(null);
  const [pipelineCounts, setPipelineCounts] = useState<Map<string, number>>(new Map());

  const reload = useCallback(async () => {
    const proj = await getProjects();
    setProjects(proj);
    // Fetch pipeline counts
    const counts = new Map<string, number>();
    await Promise.all(
      proj.map(async (p) => {
        const pipe = await getPipeline(p.id);
        counts.set(p.id, pipe.length);
      })
    );
    setPipelineCounts(counts);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const resetForm = () => {
    setForm({
      name: '', description: '', stage: 'Pre-Seed', deckUrl: '',
      raiseAmount: '', targetInvestors: '', sectors: '', location: '', website: '',
    });
    setPendingFiles([]);
  };

  const handleSave = async () => {
    const sectors = form.sectors.split(',').map((s) => s.trim()).filter(Boolean);
    const projectId = editing ? editing.id : uid();

    // Save project first
    const projectData: Project = {
      id: projectId,
      name: form.name,
      description: form.description,
      stage: form.stage,
      deckUrl: form.deckUrl,
      raiseAmount: form.raiseAmount,
      targetInvestors: form.targetInvestors,
      sectors,
      location: form.location,
      website: form.website,
      files: editing?.files || [],
      createdAt: editing?.createdAt || new Date().toISOString(),
    };

    await saveProject(projectData);

    // Upload pending files
    for (const pf of pendingFiles) {
      await uploadFile(projectId, pf.file, pf.type);
    }

    setEditing(null);
    setAdding(false);
    resetForm();
    await reload();
  };

  const startEdit = (p: Project) => {
    setEditing(p);
    setSelectedProject(null);
    setForm({
      name: p.name,
      description: p.description,
      stage: p.stage,
      deckUrl: p.deckUrl,
      raiseAmount: p.raiseAmount || '',
      targetInvestors: p.targetInvestors || '',
      sectors: (p.sectors || []).join(', '),
      location: p.location || '',
      website: p.website || '',
    });
    setPendingFiles([]);
  };

  const handleDeleteFile = async (project: Project, fileIdx: number) => {
    const file = project.files?.[fileIdx];
    if (file && (file as ProjectFile & { id?: string }).id) {
      await deleteFile((file as ProjectFile & { id?: string }).id!);
    }
    await reload();
    if (selectedProject?.id === project.id) {
      const updated = (await getProjects()).find((p) => p.id === project.id);
      if (updated) setSelectedProject(updated);
    }
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFiles([...pendingFiles, { file, type: uploadFileType }]);
    }
    e.target.value = '';
  };

  const handleUploadToProject = async (project: Project, file: File, type: string) => {
    await uploadFile(project.id, file, type);
    await reload();
    if (selectedProject?.id === project.id) {
      const updated = (await getProjects()).find((p) => p.id === project.id);
      if (updated) setSelectedProject(updated);
    }
  };

  const getFileTypeLabel = (type: string) => {
    return FILE_TYPES.find((t) => t.value === type)?.label || type;
  };

  // ─── Detail View ─────────────────────────────────────────

  if (selectedProject) {
    const pipelineCount = pipelineCounts.get(selectedProject.id) || 0;
    const project = projects.find((p) => p.id === selectedProject.id) || selectedProject;

    return (
      <div>
        <button
          onClick={() => setSelectedProject(null)}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4"
        >
          &larr; Back to projects
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            </div>
            <button
              onClick={() => startEdit(project)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              <Edit2 size={12} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Stage</div>
              <div className="text-sm font-medium text-gray-900 mt-0.5">{project.stage}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Raise Amount</div>
              <div className="text-sm font-medium text-gray-900 mt-0.5">{project.raiseAmount || '—'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Pipeline</div>
              <div className="text-sm font-medium text-gray-900 mt-0.5">{pipelineCount} investors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Target</div>
              <div className="text-sm font-medium text-gray-900 mt-0.5">{project.targetInvestors || '—'}</div>
            </div>
          </div>

          {project.sectors && project.sectors.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">Sectors</div>
              <div className="flex flex-wrap gap-1.5">
                {project.sectors.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 text-xs">
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:underline"
              >
                <Globe size={12} />
                Website
              </a>
            )}
            {project.deckUrl && (
              <a
                href={project.deckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:underline"
              >
                <FileText size={12} />
                Deck Link
              </a>
            )}
            {project.location && (
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin size={12} />
                {project.location}
              </span>
            )}
          </div>
        </div>

        {/* Files / Materials */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pitch Materials & Files</h3>
            <div className="flex items-center gap-2">
              <select
                value={uploadFileType}
                onChange={(e) => setUploadFileType(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-md text-xs outline-none"
              >
                {FILE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.pptx,.ppt,.key,.png,.jpg,.jpeg,.mp4,.mov,.doc,.docx,.xlsx,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadToProject(project, file, uploadFileType);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs hover:bg-gray-800"
              >
                <Upload size={12} />
                Upload
              </button>
            </div>
          </div>

          {(!project.files || project.files.length === 0) ? (
            <div className="text-center py-8 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No files uploaded yet</p>
              <p className="text-xs mt-1">Upload your pitch deck, one-pager, financials, or marketing materials</p>
            </div>
          ) : (
            <div className="space-y-2">
              {project.files.map((f, idx) => (
                <div
                  key={(f as ProjectFile & { id?: string }).id || idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <FileText size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{f.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {getFileTypeLabel(f.type)} &middot; {new Date(f.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={f.dataUrl}
                      download={f.name}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(project, idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Investors */}
        <RecommendedInvestorsSection
          project={project}
          onOpenDrawer={(inv) => setDrawerInvestor(inv)}
          onReload={reload}
        />

        {drawerInvestor && (
          <InvestorDrawer
            investor={drawerInvestor}
            onClose={() => setDrawerInvestor(null)}
            onUpdate={() => { reload(); }}
          />
        )}
      </div>
    );
  }

  // ─── Project List ────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
            resetForm();
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const pipelineCount = pipelineCounts.get(p.id) || 0;
          const fileCount = (p.files || []).length;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FolderOpen size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{p.stage}</span>
                      {p.raiseAmount && (
                        <>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-xs text-gray-500">{p.raiseAmount}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Edit2
                  size={14}
                  className="text-gray-300 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(p);
                  }}
                />
              </div>
              {p.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{p.description}</p>
              )}
              {p.sectors && p.sectors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.sectors.slice(0, 4).map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px]">
                      {s}
                    </span>
                  ))}
                  {p.sectors.length > 4 && (
                    <span className="text-[11px] text-gray-400">+{p.sectors.length - 4}</span>
                  )}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span>{pipelineCount} in pipeline</span>
                {fileCount > 0 && <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>}
                {p.deckUrl && (
                  <span className="text-blue-500">Deck linked</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(adding || editing) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button
                onClick={() => { setAdding(false); setEditing(null); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this project do? (used for investor matching)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  >
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raise Amount</label>
                  <input
                    value={form.raiseAmount}
                    onChange={(e) => setForm({ ...form, raiseAmount: e.target.value })}
                    placeholder="$500K"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sectors (comma-separated)</label>
                <input
                  value={form.sectors}
                  onChange={(e) => setForm({ ...form, sectors: e.target.value })}
                  placeholder="SaaS, Consumer Internet, AI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Los Angeles, CA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://myapp.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Investors</label>
                <input
                  value={form.targetInvestors}
                  onChange={(e) => setForm({ ...form, targetInvestors: e.target.value })}
                  placeholder="e.g. 30 investors, focus on LA-based VCs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deck URL (external link)</label>
                <input
                  value={form.deckUrl}
                  onChange={(e) => setForm({ ...form, deckUrl: e.target.value })}
                  placeholder="https://docsend.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>

              {/* File upload section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Materials</label>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-md text-xs outline-none"
                  >
                    {FILE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept=".pdf,.pptx,.ppt,.key,.png,.jpg,.jpeg,.mp4,.mov,.doc,.docx,.xlsx,.csv"
                    onChange={handleAddFile}
                    className="hidden"
                    id="project-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('project-file-input')?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50"
                  >
                    <Upload size={12} />
                    Add File
                  </button>
                </div>
                {pendingFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {pendingFiles.map((pf, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs">
                        <span className="text-gray-700">
                          <span className="text-gray-400">[{getFileTypeLabel(pf.type)}]</span>{' '}
                          {pf.file.name}
                        </span>
                        <button
                          onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-30"
              >
                {editing ? 'Save Changes' : 'Create Project'}
              </button>
              <button
                onClick={() => { setAdding(false); setEditing(null); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recommended Investors Section ────────────────────────

function RecommendedInvestorsSection({
  project,
  onOpenDrawer,
  onReload,
}: {
  project: Project;
  onOpenDrawer: (inv: Investor) => void;
  onReload: () => void;
}) {
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

  useEffect(() => {
    (async () => {
      const [recs, inv] = await Promise.all([
        getRecommendedInvestors(project.id, 20),
        getInvestors(),
      ]);
      setRecommendations(recs);
      setAllInvestors(inv);
      setAiMatches(null);
      setAddedIds(new Set());
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
    const next = new Set(Array.from(addedIds));
    next.add(investorId);
    setAddedIds(next);
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-900">Recommended Investors</h3>
          <span className="text-xs text-gray-400">
            {displayList.length} match{displayList.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('local')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                mode === 'local' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Tag size={11} className="inline mr-1" />
              Tags
            </button>
            <button
              onClick={() => { if (aiMatches) setMode('ai'); else handleAiMatch(); }}
              disabled={aiLoading}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                mode === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              AI Match
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 text-xs text-gray-500">
        {mode === 'local' ? (
          <>Matching based on <strong>stage</strong>, <strong>sectors</strong>, <strong>location</strong>, and <strong>check size</strong> tags.</>
        ) : (
          <>AI-powered matching using project description, investor profiles, and strategic fit analysis.</>
        )}
      </div>

      {displayList.length === 0 ? (
        <div className="text-center py-8">
          <Users size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">
            {allInvestors.length === 0
              ? 'No investors in your database yet. Import some from the Discover page.'
              : 'No matching investors found. Try adding more sectors to your project or importing more investors.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map(({ investor, score, reasons }) => {
            const isAdded = addedIds.has(investor.id);
            return (
              <div
                key={investor.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg border flex flex-col items-center justify-center ${scoreColor(score)}`}>
                  <span className="text-sm font-bold">{score}</span>
                  <span className="text-[9px] uppercase tracking-wide">{scoreLabel(score)}</span>
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onOpenDrawer(investor)}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{investor.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {investor.role ? `${investor.role}, ` : ''}{investor.firm}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reasons.map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {investor.checkSize && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                    <DollarSign size={11} />
                    {investor.checkSize}
                  </div>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAdded ? (
                    <span className="px-2.5 py-1.5 text-[11px] text-green-600 bg-green-50 rounded-lg font-medium">
                      Added
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAddToPipeline(investor.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900 text-white text-[11px] rounded-lg hover:bg-gray-800"
                        title="Add to pipeline"
                      >
                        <Plus size={11} />
                        Pipeline
                      </button>
                      <button
                        onClick={() => onOpenDrawer(investor)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Reach out"
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
  );
}
