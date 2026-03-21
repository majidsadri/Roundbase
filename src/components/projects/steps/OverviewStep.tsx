'use client';

import { useState, useRef } from 'react';
import {
  Edit2, Upload, Globe, Loader2, Save, X, MapPin, FileText, DollarSign,
  Target, Tag, Briefcase,
} from 'lucide-react';
import { Project } from '@/types';
import { saveProject } from '@/lib/store';
import ProjectLogo from '../../ProjectLogo';

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

interface Props {
  project: Project;
  pipelineCount: number;
  onUpdate: (p: Project) => void;
}

export default function OverviewStep({ project, pipelineCount, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    stage: project.stage,
    raiseAmount: project.raiseAmount || '',
    targetInvestors: project.targetInvestors || '',
    sectors: (project.sectors || []).join(', '),
    location: project.location || '',
    website: project.website || '',
    deckUrl: project.deckUrl || '',
  });
  const [logoPreview, setLogoPreview] = useState(project.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setForm({
      name: project.name,
      description: project.description,
      stage: project.stage,
      raiseAmount: project.raiseAmount || '',
      targetInvestors: project.targetInvestors || '',
      sectors: (project.sectors || []).join(', '),
      location: project.location || '',
      website: project.website || '',
      deckUrl: project.deckUrl || '',
    });
    setLogoPreview(project.logoUrl || '');
    setLogoFile(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const sectors = form.sectors.split(',').map((s) => s.trim()).filter(Boolean);
    const updated: Project = {
      ...project,
      name: form.name,
      description: form.description,
      stage: form.stage,
      raiseAmount: form.raiseAmount,
      targetInvestors: form.targetInvestors,
      sectors,
      location: form.location,
      website: form.website,
      deckUrl: form.deckUrl,
      logoUrl: logoPreview && !logoPreview.startsWith('data:') ? logoPreview : project.logoUrl || '',
    };

    await saveProject(updated);

    if (logoFile) {
      const reader = new FileReader();
      const logoData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoFile);
      });
      const res = await fetch('/api/projects/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, logoData, fileName: logoFile.name }),
      });
      const result = await res.json();
      if (result.logoUrl) {
        updated.logoUrl = result.logoUrl;
        await saveProject(updated);
      }
    }

    onUpdate(updated);
    setEditing(false);
    setSaving(false);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleFetchLogo = async () => {
    if (!form.website) return;
    setFetchingLogo(true);
    try {
      const res = await fetch('/api/projects/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.website, projectId: project.id }),
      });
      const data = await res.json();
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
        setLogoFile(null);
      }
    } catch { /* ignore */ }
    setFetchingLogo(false);
  };

  // Check what's missing for guidance
  const missing: string[] = [];
  if (!project.description) missing.push('description');
  if (!project.raiseAmount) missing.push('raise amount');
  if (!project.sectors || project.sectors.length === 0) missing.push('sectors');
  if (!project.location) missing.push('location');

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Edit Project Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-40"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
            <button type="button" onClick={() => logoRef.current?.click()} className="relative group">
              {logoPreview ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-indigo-300 bg-white flex items-center justify-center transition-colors">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 group-hover:border-indigo-300 flex flex-col items-center justify-center bg-gray-50 transition-colors">
                  <Upload size={14} className="text-gray-400" />
                  <span className="text-[9px] text-gray-400 mt-0.5">Logo</span>
                </div>
              )}
            </button>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Project Logo</p>
              <div className="flex items-center gap-3 mt-1">
                {form.website && (
                  <button type="button" onClick={handleFetchLogo} disabled={fetchingLogo} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50">
                    {fetchingLogo ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
                    {fetchingLogo ? 'Fetching...' : 'Auto-fetch'}
                  </button>
                )}
                {logoPreview && (
                  <button type="button" onClick={() => { setLogoPreview(''); setLogoFile(null); }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What does your startup do? This is used for AI investor matching." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Raise Amount</label>
              <input value={form.raiseAmount} onChange={(e) => setForm({ ...form, raiseAmount: e.target.value })} placeholder="$500K" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sectors (comma-separated)</label>
            <input value={form.sectors} onChange={(e) => setForm({ ...form, sectors: e.target.value })} placeholder="SaaS, AI, Fintech" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Los Angeles, CA" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://myapp.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Investors</label>
            <input value={form.targetInvestors} onChange={(e) => setForm({ ...form, targetInvestors: e.target.value })} placeholder="e.g. 30 investors, focus on LA-based VCs" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deck URL (external link)</label>
            <input value={form.deckUrl} onChange={(e) => setForm({ ...form, deckUrl: e.target.value })} placeholder="https://docsend.com/..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors" />
          </div>
        </div>
      </div>
    );
  }

  // View mode — clean info layout
  return (
    <div className="space-y-3">
      {/* Guidance banner when fields are missing */}
      {missing.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <Target size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-800">Complete your profile for better investor matching</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">
              Add your {missing.join(', ')} to improve AI recommendations.
            </p>
          </div>
          <button
            onClick={startEdit}
            className="flex-shrink-0 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[11px] font-medium hover:bg-amber-200 transition-colors"
          >
            Complete
          </button>
        </div>
      )}

      {/* Main info card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 sm:px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {project.description ? (
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No description yet — add one to improve investor matching.</p>
            )}
          </div>
          <button
            onClick={startEdit}
            className="flex-shrink-0 ml-4 flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
          >
            <Edit2 size={11} /> Edit
          </button>
        </div>

        {/* Detail rows */}
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          <DetailRow icon={<Briefcase size={13} />} label="Stage" value={project.stage} />
          <DetailRow icon={<DollarSign size={13} />} label="Raise" value={project.raiseAmount} />
          <DetailRow icon={<MapPin size={13} />} label="Location" value={project.location} />
          <DetailRow icon={<Target size={13} />} label="Target" value={project.targetInvestors} />
          {project.website && (
            <div className="px-5 py-2.5 flex items-center gap-3">
              <Globe size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 w-16 flex-shrink-0">Website</span>
              <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:text-indigo-700 truncate">
                {project.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
          {project.deckUrl && (
            <div className="px-5 py-2.5 flex items-center gap-3">
              <FileText size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 w-16 flex-shrink-0">Deck</span>
              <a href={project.deckUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:text-indigo-700 truncate">
                External deck link
              </a>
            </div>
          )}
        </div>

        {/* Sectors */}
        {project.sectors && project.sectors.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <Tag size={12} className="text-gray-400 flex-shrink-0" />
            {project.sectors.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[11px] font-medium">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Files</div>
          <div className="text-lg font-semibold text-gray-900 mt-0.5">{(project.files || []).length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pipeline</div>
          <div className="text-lg font-semibold text-indigo-600 mt-0.5">{pipelineCount}</div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="px-5 py-2.5 flex items-center gap-3">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
      <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-300'}`}>{value || '—'}</span>
    </div>
  );
}
