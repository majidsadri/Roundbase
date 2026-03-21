'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Trash2, Check, ChevronRight,
  FileText, Users, Kanban, Settings,
} from 'lucide-react';
import { Project } from '@/types';
import { getProjects, deleteProject, getPipeline } from '@/lib/store';
import ProjectLogo from '../ProjectLogo';
import OverviewStep from './steps/OverviewStep';
import FilesStep from './steps/FilesStep';
import FindInvestorsStep from './steps/FindInvestorsStep';
import PipelineStep from './steps/PipelineStep';

type Step = 'overview' | 'files' | 'investors' | 'pipeline';

const STEPS: { key: Step; label: string; shortLabel: string; icon: React.ReactNode; hint: string }[] = [
  { key: 'overview', label: 'Overview', shortLabel: 'Info', icon: <Settings size={14} />, hint: 'Set up your project details' },
  { key: 'files', label: 'Files & Deck', shortLabel: 'Files', icon: <FileText size={14} />, hint: 'Upload materials & generate pitch deck' },
  { key: 'investors', label: 'Find Investors', shortLabel: 'Find', icon: <Users size={14} />, hint: 'Discover matching investors' },
  { key: 'pipeline', label: 'Pipeline', shortLabel: 'Pipeline', icon: <Kanban size={14} />, hint: 'Track your investor outreach' },
];

interface Props {
  project: Project;
  onBack: () => void;
  onReload: () => void;
}

export default function ProjectWizard({ project: initialProject, onBack, onReload }: Props) {
  const [step, setStep] = useState<Step>('overview');
  const [project, setProject] = useState<Project>(initialProject);
  const [pipelineCount, setPipelineCount] = useState(0);

  const refreshProject = useCallback(async () => {
    const projects = await getProjects();
    const updated = projects.find((p) => p.id === project.id);
    if (updated) setProject(updated);
    const pipe = await getPipeline(project.id);
    setPipelineCount(pipe.length);
    onReload();
  }, [project.id, onReload]);

  useEffect(() => {
    getPipeline(project.id).then((p) => setPipelineCount(p.length));
  }, [project.id]);

  const handleUpdate = (updated: Project) => {
    setProject(updated);
    onReload();
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${project.name}"? This will also remove all files and pipeline entries.`)) {
      await deleteProject(project.id);
      onReload();
      onBack();
    }
  };

  const completionStatus: Record<Step, boolean> = {
    overview: !!(project.name && project.description && project.stage),
    files: (project.files || []).length > 0,
    investors: false,
    pipeline: pipelineCount > 0,
  };

  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const nextStep = currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1] : null;

  const goNext = () => {
    if (nextStep) setStep(nextStep.key);
  };

  return (
    <div>
      {/* Integrated header with project info + tabs */}
      <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Project header row */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Back to projects"
            >
              <ArrowLeft size={15} />
            </button>
            <ProjectLogo logoUrl={project.logoUrl} name={project.name} size="sm" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h2>
              <p className="text-[11px] text-gray-400 truncate">{project.stage}{project.raiseAmount ? ` · ${project.raiseAmount}` : ''}</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete project"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Tab bar — connected to header */}
        <div className="flex border-t border-gray-100">
          {STEPS.map((s, idx) => {
            const isActive = step === s.key;
            const isComplete = completionStatus[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setStep(s.key)}
                className={`flex-1 relative px-2 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-indigo-50/50'
                    : 'hover:bg-gray-50/80'
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-indigo-500" />
                )}
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`flex-shrink-0 ${
                    isActive
                      ? 'text-indigo-600'
                      : isComplete
                      ? 'text-emerald-500'
                      : 'text-gray-400'
                  }`}>
                    {isComplete && !isActive ? <Check size={14} /> : s.icon}
                  </span>
                  <span className={`text-xs font-medium hidden sm:inline ${
                    isActive ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {s.label}
                  </span>
                  <span className={`text-xs font-medium sm:hidden ${
                    isActive ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {s.shortLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div>
        {step === 'overview' && (
          <OverviewStep project={project} pipelineCount={pipelineCount} onUpdate={handleUpdate} />
        )}
        {step === 'files' && (
          <FilesStep project={project} onUpdate={handleUpdate} />
        )}
        {step === 'investors' && (
          <FindInvestorsStep project={project} onReload={refreshProject} />
        )}
        {step === 'pipeline' && (
          <PipelineStep project={project} onReload={refreshProject} onGoToInvestors={() => setStep('investors')} />
        )}
      </div>

      {/* Continue to next step */}
      {nextStep && (
        <button
          onClick={goNext}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all group"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <span>Continue to <span className="font-medium">{nextStep.label}</span></span>
          <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </button>
      )}
    </div>
  );
}
