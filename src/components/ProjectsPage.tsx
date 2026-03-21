'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, X, ChevronRight,
} from 'lucide-react';
import { Project } from '@/types';
import {
  getProjects, saveProject, uid, getPipeline, uploadFile,
} from '@/lib/store';
import ProjectLogo from './ProjectLogo';
import ProjectWizard from './projects/ProjectWizard';

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

interface ProjectForm {
  name: string;
  description: string;
  stage: string;
  website: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProjectForm>({ name: '', description: '', stage: 'Pre-Seed', website: '' });
  const [pipelineCounts, setPipelineCounts] = useState<Map<string, number>>(new Map());

  const reload = useCallback(async () => {
    const proj = await getProjects();
    setProjects(proj);
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

  const handleCreate = async () => {
    const projectId = uid();
    const projectData: Project = {
      id: projectId,
      name: form.name,
      description: form.description,
      stage: form.stage,
      deckUrl: '',
      raiseAmount: '',
      targetInvestors: '',
      sectors: [],
      location: '',
      website: form.website,
      logoUrl: '',
      files: [],
      createdAt: new Date().toISOString(),
    };

    await saveProject(projectData);

    // Auto-fetch logo from website
    if (form.website) {
      fetch('/api/projects/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.website, projectId }),
      }).catch(() => {});
    }

    setAdding(false);
    setForm({ name: '', description: '', stage: 'Pre-Seed', website: '' });
    await reload();

    // Open the new project in wizard
    const updated = (await getProjects()).find((p) => p.id === projectId);
    if (updated) setSelectedProject(updated);
  };

  // Wizard view
  if (selectedProject) {
    return (
      <ProjectWizard
        key={selectedProject.id}
        project={selectedProject}
        onBack={() => { setSelectedProject(null); reload(); }}
        onReload={reload}
      />
    );
  }

  // Project list view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No projects yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Create your first project to start finding investors and managing your fundraise.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => {
            const pipelineCount = pipelineCounts.get(p.id) || 0;
            const fileCount = (p.files || []).length;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="text-left bg-white rounded-xl border border-gray-100 hover:border-indigo-200 transition-all group overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Accent bar */}
                <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <ProjectLogo logoUrl={p.logoUrl} name={p.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-gray-900 truncate">{p.name}</h3>
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
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  </div>

                  {p.description && (
                    <p className="text-[13px] text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}

                  {p.sectors && p.sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {p.sectors.slice(0, 3).map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[11px] font-medium">{s}</span>
                      ))}
                      {p.sectors.length > 3 && (
                        <span className="text-[11px] text-gray-400 self-center">+{p.sectors.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
                    {pipelineCount > 0 && <span className="text-indigo-500 font-medium">{pipelineCount} in pipeline</span>}
                    {pipelineCount === 0 && <span>No pipeline yet</span>}
                    {fileCount > 0 && <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Simplified Create Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Project</h2>
              <button
                onClick={() => { setAdding(false); setForm({ name: '', description: '', stage: 'Pre-Seed', website: '' }); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">Start with the basics — you can add more details after creating.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My Startup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this project do? (used for investor matching)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-30 active:scale-[0.99] transition-all"
              >
                Create & Set Up
              </button>
              <button
                onClick={() => { setAdding(false); setForm({ name: '', description: '', stage: 'Pre-Seed', website: '' }); }}
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
