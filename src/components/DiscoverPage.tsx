'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Globe, Search, Download, ExternalLink, Loader2, ClipboardPaste, Link,
  ChevronRight, Check, X, Upload, FileText, Star, ArrowLeft, Mail, Linkedin, Users,
  Sparkles, Target, Building2, MapPin, DollarSign, ArrowRight,
} from 'lucide-react';
import { Investor, ParsedInvestor, Project } from '@/types';
import {
  saveInvestor, getInvestors, getProjects, saveProject,
  parseNFXSignalTable, scoreInvestorMatch, extractSectors, extractStages,
  saveParsedInvestors, savePipelineEntry, uid,
} from '@/lib/store';
import ProjectLogo from './ProjectLogo';

interface TeamMember {
  name: string;
  role: string;
  email: string;
  linkedin: string;
  bio: string;
  imageUrl: string;
}

interface CrawlResult {
  url: string;
  title: string;
  description: string;
  textContent: string;
  emails: string[];
  linkedins: string[];
  domain: string;
  teamMembers?: TeamMember[];
  teamPageLinks?: string[];
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<'paste' | 'research' | 'find'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('discover-tab');
      if (saved === 'paste' || saved === 'research' || saved === 'find') return saved;
    }
    return 'paste';
  });
  const [investorCount, setInvestorCount] = useState(0);

  useEffect(() => {
    getInvestors().then((inv) => setInvestorCount(inv.length));
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex bg-gray-100/80 rounded-xl p-1 gap-0.5">
          {([
            { key: 'find' as const, label: 'Find VCs', icon: <Sparkles size={13} /> },
            { key: 'research' as const, label: 'Lookup', icon: <Search size={13} /> },
            { key: 'paste' as const, label: 'Import', icon: <ClipboardPaste size={13} /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); sessionStorage.setItem('discover-tab', tab.key); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={activeTab === tab.key ? 'text-indigo-500' : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
          <Users size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500 tabular-nums font-medium">{investorCount}</span>
          <span className="text-xs text-gray-400">saved</span>
        </div>
      </div>

      {activeTab === 'paste' && <PasteImportTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
      {activeTab === 'research' && <ResearchTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
      {activeTab === 'find' && <FindVCsTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
    </div>
  );
}

// ─── PROJECT KEYWORDS ────────────────────────────────────────────────

function getProjectKeywords(project: Project): string[] {
  // Extract keywords from project description for matching
  const desc = project.description.toLowerCase();
  const allKeywords = [
    'AI', 'SaaS', 'FinTech', 'Consumer Internet', 'Enterprise', 'SMB Software',
    'Marketplaces', 'E-commerce', 'Education', 'Health IT', 'Digital Health',
    'Consumer Health', 'Insurance', 'Logistics', 'IoT', 'Real Estate', 'PropTech',
    'Social Networks', 'Media', 'Advertising', 'Gaming', 'Developer Tools',
    'Cloud Infrastructure', 'Cybersecurity', 'Data Services', 'Manufacturing',
    'Creator Economy', 'Passion Economy', 'Future of Work', 'ClimateTech',
    'CleanTech', 'Analytics', 'Supply Chain', 'Social Commerce', 'Direct-to-Consumer',
    'DTC', 'Gig Economy', 'Generative Tech',
  ];

  const matched: string[] = [];
  for (const kw of allKeywords) {
    if (desc.includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }

  // Add common matches based on description keywords
  if (desc.includes('business card') || desc.includes('contact') || desc.includes('network')) {
    if (!matched.includes('SaaS')) matched.push('SaaS');
    if (!matched.includes('Consumer Internet')) matched.push('Consumer Internet');
    if (!matched.includes('SMB Software')) matched.push('SMB Software');
  }
  if (desc.includes('ai') || desc.includes('artificial') || desc.includes('machine learning')) {
    if (!matched.includes('AI')) matched.push('AI');
  }
  if (desc.includes('app') || desc.includes('mobile')) {
    if (!matched.includes('Consumer Internet')) matched.push('Consumer Internet');
  }

  return matched.length > 0 ? matched : ['SaaS', 'AI', 'Consumer Internet'];
}

// ─── NFX Signal Import (Revamped) ───────────────────────────────────

type Step = 'project' | 'paste' | 'preview';

function PasteImportTab({ onImport }: { onImport: () => void }) {
  const [step, setStep] = useState<Step>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Restore last selected project
  useEffect(() => {
    getProjects().then((projs) => {
      setProjects(projs);
      const savedId = sessionStorage.getItem('discover-project');
      if (savedId) {
        const proj = projs.find(p => p.id === savedId);
        if (proj) { setSelectedProject(proj); setStep('paste'); }
      }
    });
  }, []);
  const [pasteText, setPasteText] = useState('');
  const [parsedInvestors, setParsedInvestors] = useState<ParsedInvestor[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [parseMode, setParseMode] = useState<'local' | 'ai'>('ai');
  const [imported, setImported] = useState<number | null>(null);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const deckRef = useRef<HTMLInputElement>(null);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    sessionStorage.setItem('discover-project', project.id);
    setStep('paste');
  };

  const handleParse = async () => {
    if (!pasteText.trim() || !selectedProject) return;
    setLoading(true);

    try {
      let investors: ParsedInvestor[];

      if (parseMode === 'ai') {
        // Try AI parsing first
        try {
          const res = await fetch('/api/parse-investors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: pasteText,
              projectDescription: selectedProject.description,
              projectStage: selectedProject.stage,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            investors = data.investors || [];
          } else {
            // Fallback to local parser
            investors = parseNFXSignalTable(pasteText);
          }
        } catch {
          investors = parseNFXSignalTable(pasteText);
        }
      } else {
        investors = parseNFXSignalTable(pasteText);
      }

      // Score each investor
      const keywords = getProjectKeywords(selectedProject);
      investors = investors.map((inv) => {
        const { score, reasons } = scoreInvestorMatch(inv, selectedProject.stage, keywords);
        return { ...inv, matchScore: score, matchReasons: reasons };
      });

      // Sort by match score (highest first)
      investors.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setParsedInvestors(investors);
      // Select all by default
      setSelected(new Set(investors.map((_, i) => i)));
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProject) return;
    const toImport = parsedInvestors.filter((_, i) => selected.has(i));
    const count = await saveParsedInvestors(toImport, selectedProject.id);

    // If deck file attached, upload it
    if (deckFile && selectedProject) {
      const { uploadFile } = await import('@/lib/store');
      await uploadFile(selectedProject.id, deckFile, 'deck');
    }

    setImported(count);
    onImport();
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === parsedInvestors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(parsedInvestors.map((_, i) => i)));
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('paste');
      setParsedInvestors([]);
      setImported(null);
    } else if (step === 'paste') {
      setStep('project');
      setSelectedProject(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    if (score > 0) return 'bg-gray-100 text-gray-600';
    return 'bg-gray-50 text-gray-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Strong match';
    if (score >= 40) return 'Good match';
    if (score > 0) return 'Partial match';
    return 'Low match';
  };

  // ─── Step 1: Select Project ──────────────────────────────

  if (step === 'project') {
    return (
      <div className="max-w-5xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardPaste size={16} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Select a project</h3>
              <p className="text-xs text-gray-400 mt-0.5">Choose which project to import investors for</p>
            </div>
          </div>

          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <ProjectLogo logoUrl={project.logoUrl} name={project.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{project.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{project.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-medium border border-gray-100">
                    {project.stage}
                  </span>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Paste Data ──────────────────────────────────

  if (step === 'paste') {
    return (
      <div className="max-w-5xl">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          Back to project selection
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardPaste size={16} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Import for {selectedProject?.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Paste from NFX Signal, LinkedIn, Crunchbase, or any investor list</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-medium">
              {selectedProject?.stage}
            </span>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'Paste investor data here...\n\nSupported formats:\n- NFX Signal table\n- LinkedIn Sales Navigator export\n- Crunchbase investor list\n- CSV or spreadsheet copy-paste\n- Any structured investor data'}
            rows={12}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 resize-none outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 bg-gray-50/50 focus:bg-white placeholder:text-gray-300 transition-all"
          />

          {/* Actions row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Parse mode toggle */}
            <div className="flex bg-gray-100/80 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setParseMode('ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  parseMode === 'ai'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles size={11} className={parseMode === 'ai' ? 'text-indigo-500' : 'text-gray-400'} />
                AI Parse
              </button>
              <button
                onClick={() => setParseMode('local')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  parseMode === 'local'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                NFX Local
              </button>
            </div>

            {/* Deck attachment */}
            <input
              ref={deckRef}
              type="file"
              accept=".pdf,.pptx,.ppt,.key,.png,.jpg"
              onChange={(e) => setDeckFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={() => deckRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <FileText size={12} />
              {deckFile ? deckFile.name : 'Attach deck'}
            </button>
            {deckFile && (
              <button onClick={() => setDeckFile(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            )}

            <button
              onClick={handleParse}
              disabled={!pasteText.trim() || loading}
              className="ml-auto px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {loading ? 'Parsing...' : 'Parse & Preview'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { source: 'NFX Signal', tip: 'Select rows, Cmd+A, copy' },
            { source: 'LinkedIn', tip: 'Copy table or export CSV' },
            { source: 'Crunchbase', tip: 'Copy investor list' },
            { source: 'Spreadsheet', tip: 'Select cells, paste directly' },
          ].map((t) => (
            <div key={t.source} className="px-3 py-2.5 bg-gray-50/80 border border-gray-100 rounded-xl">
              <p className="text-[11px] font-semibold text-gray-700">{t.source}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 3: Preview Table ───────────────────────────────

  return (
    <div>
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors mb-4"
      >
        <ArrowLeft size={13} />
        Back to paste
      </button>

      {imported !== null ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-2xl mb-4">
            <Check size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {imported} investor{imported !== 1 ? 's' : ''} imported
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Added to {selectedProject?.name}&apos;s pipeline as &quot;Researching&quot;.
            {deckFile && ' Deck attached to project.'}
          </p>
          <button
            onClick={() => {
              setStep('project');
              setSelectedProject(null);
              setPasteText('');
              setParsedInvestors([]);
              setImported(null);
              setDeckFile(null);
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Import More
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {parsedInvestors.length} investors parsed for {selectedProject?.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedProject?.stage} stage &middot; {getProjectKeywords(selectedProject!).slice(0, 4).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 tabular-nums">
                {selected.size} / {parsedInvestors.length} selected
              </span>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center gap-2"
              >
                <Download size={14} />
                Import ({selected.size})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left">
                      <input
                        type="checkbox"
                        checked={selected.size === parsedInvestors.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Match</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Investor</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Firm</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Role</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Sweet Spot</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Locations</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Top Sectors</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Stages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedInvestors.map((inv, idx) => {
                    const sectors = extractSectors(inv.categories);
                    const stages = extractStages(inv.categories);
                    const score = inv.matchScore || 0;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 transition-colors ${
                          selected.has(idx) ? '' : 'opacity-50'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(idx)}
                            onChange={() => toggleSelect(idx)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${getScoreColor(
                                score
                              )}`}
                              title={inv.matchReasons?.join(', ')}
                            >
                              {score > 0 && <Star size={10} className="mr-0.5" />}
                              {score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                          {inv.name}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inv.firm}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{inv.role}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          <div className="text-sm">{inv.checkSize}</div>
                          {inv.checkRange && (
                            <div className="text-[11px] text-gray-400">{inv.checkRange}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {inv.locations.slice(0, 3).map((loc) => (
                              <span
                                key={loc}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]"
                              >
                                {loc}
                              </span>
                            ))}
                            {inv.locations.length > 3 && (
                              <span className="text-[11px] text-gray-400">
                                +{inv.locations.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {sectors.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px]"
                              >
                                {s}
                              </span>
                            ))}
                            {sectors.length > 4 && (
                              <span className="text-[11px] text-gray-400">
                                +{sectors.length - 4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {stages.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Match legend */}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
            <span>Match legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full" /> 70%+ Strong
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full" /> 40-69% Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full" /> &lt;40% Partial
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Crawl VC Website ────────────────────────────────────────────

// ─── Research & Crawl (merged Lookup + Crawl) ───────────────────

function ResearchTab({ onImport }: { onImport: () => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // AI lookup state
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [saved, setSaved] = useState(false);
  // Crawl state
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  // Project + dedup
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    getProjects().then((projs) => {
      setProjects(projs);
      const savedId = sessionStorage.getItem('discover-project');
      if (savedId) {
        const proj = projs.find(p => p.id === savedId);
        if (proj) setSelectedProject(proj);
      }
    });
    getInvestors().then((inv) => setExistingNames(new Set(inv.map(i => i.name.toLowerCase().trim()))));
  }, []);

  const isUrl = (s: string) => /^https?:\/\//i.test(s.trim()) || /^www\./i.test(s.trim());

  const handleSearch = async () => {
    const q = input.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setLookupResult(null);
    setCrawlResult(null);
    setSaved(false);
    setSavedNames(new Set());

    if (isUrl(q)) {
      // Direct URL crawl
      const crawlUrl = q.startsWith('www.') ? `https://${q}` : q;
      try {
        const res = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: crawlUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Crawl failed');
        } else {
          setCrawlResult(data);
        }
      } catch {
        setError('Network error — the site may be blocking requests.');
      }
    } else {
      // AI lookup by name
      try {
        const res = await fetch('/api/lookup-investor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setLookupResult(data);
        }
      } catch {
        setError('Lookup failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleCrawlTeamPage = async (url: string) => {
    setCrawling(true);
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        setCrawlResult(await res.json());
      }
    } catch { /* ignore */ }
    setCrawling(false);
  };

  const firmContext = lookupResult || null;

  const handleSaveMember = async (name: string, role: string, email: string, linkedin: string) => {
    if (existingNames.has(name.toLowerCase().trim())) {
      setSavedNames(prev => new Set(prev).add(name));
      return;
    }
    const inv: Investor = {
      id: uid(),
      name,
      firm: firmContext?.firm || firmContext?.name || crawlResult?.title || crawlResult?.domain || '',
      role,
      email,
      linkedin,
      checkSize: firmContext?.checkSize || '',
      stage: firmContext?.stage || '',
      sectors: firmContext?.sectors || [],
      location: firmContext?.location || '',
      introPath: '',
      notes: crawlResult ? `Crawled from ${crawlResult.url}` : `Found via Research`,
      source: crawlResult ? `Crawl: ${crawlResult.domain}` : 'Research',
      website: firmContext?.website || crawlResult?.url || '',
      createdAt: new Date().toISOString(),
    };
    await saveInvestor(inv);
    if (selectedProject) {
      await savePipelineEntry({
        id: uid(),
        projectId: selectedProject.id,
        investorId: inv.id,
        stage: 'researching',
        notes: '',
        lastContact: '',
        nextFollowup: '',
        createdAt: new Date().toISOString(),
      });
    }
    existingNames.add(name.toLowerCase().trim());
    setSavedNames(prev => new Set(prev).add(name));
    onImport();
  };

  const handleSaveLookup = async () => {
    if (!lookupResult) return;
    const inv: Investor = {
      id: uid(),
      name: lookupResult.type === 'person' ? lookupResult.name : lookupResult.firm || lookupResult.name,
      firm: lookupResult.firm || lookupResult.name,
      role: lookupResult.role || (lookupResult.type === 'firm' ? 'Firm' : ''),
      email: lookupResult.email || '',
      linkedin: lookupResult.linkedin || '',
      checkSize: lookupResult.checkSize || '',
      stage: lookupResult.stage || '',
      sectors: lookupResult.sectors || [],
      location: lookupResult.location || '',
      introPath: '',
      notes: `${lookupResult.description || ''}\n${lookupResult.notableInvestments?.length ? 'Portfolio: ' + lookupResult.notableInvestments.join(', ') : ''}${lookupResult.aum ? '\nAUM: ' + lookupResult.aum : ''}`.trim(),
      source: 'Research',
      website: lookupResult.website || '',
      createdAt: new Date().toISOString(),
    };
    await saveInvestor(inv);
    if (selectedProject) {
      await savePipelineEntry({
        id: uid(),
        projectId: selectedProject.id,
        investorId: inv.id,
        stage: 'researching',
        notes: '',
        lastContact: '',
        nextFollowup: '',
        createdAt: new Date().toISOString(),
      });
    }
    setSaved(true);
    existingNames.add(lookupResult.name.toLowerCase().trim());
    onImport();
  };

  const [saveAllDone, setSaveAllDone] = useState(false);

  const handleSaveAll = async () => {
    if (!crawlResult) return;
    setSavingAll(true);
    setSaveAllDone(false);
    const members = crawlResult.teamMembers || [];
    for (const m of members) {
      if (!savedNames.has(m.name)) {
        await handleSaveMember(m.name, m.role, m.email, m.linkedin);
      }
    }
    const teamLinkedins = new Set(members.map((m) => m.linkedin).filter(Boolean));
    for (const li of crawlResult.linkedins) {
      if (teamLinkedins.has(li)) continue;
      const handle = li.split('/in/')[1] || li;
      const displayName = handle.replace(/-/g, ' ');
      if (!savedNames.has(displayName)) {
        await handleSaveMember(displayName, '', '', li);
      }
    }
    setSavingAll(false);
    setSaveAllDone(true);
    setTimeout(() => setSaveAllDone(false), 3000);
  };

  const crawlTotalFound = crawlResult ? (crawlResult.teamMembers?.length || 0) + (crawlResult.linkedins?.length || 0) + (crawlResult.emails?.length || 0) : 0;

  const inputIsUrl = isUrl(input);

  return (
    <div className="max-w-5xl">
      {/* Hero search area */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 sm:px-6 pt-5 pb-5">
          {/* Smart search bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {inputIsUrl
                  ? <Globe size={15} className="text-indigo-400" />
                  : <Search size={15} className="text-gray-400" />}
              </div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search a firm name or paste a team page URL..."
                className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all bg-gray-50/50 focus:bg-white placeholder:text-gray-400"
              />
              {input.trim() && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {inputIsUrl ? 'URL' : 'NAME'}
                </span>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center gap-2 flex-shrink-0"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> :
               inputIsUrl ? <Globe size={15} /> : <Sparkles size={15} />}
              {loading ? (inputIsUrl ? 'Scanning...' : 'Looking up...') : (inputIsUrl ? 'Crawl' : 'Lookup')}
            </button>
          </div>

          {/* Project selector */}
          {projects.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-medium">Link to project:</span>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => { const proj = projects.find(p => p.id === e.target.value) || null; setSelectedProject(proj); if (proj) sessionStorage.setItem('discover-project', proj.id); else sessionStorage.removeItem('discover-project'); }}
                className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-gray-600 cursor-pointer hover:border-gray-200 transition-colors"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mb-5 flex items-start gap-2.5 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
            <X size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* AI Lookup Result Card */}
      {lookupResult && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* Firm/person header */}
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon avatar */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                lookupResult.type === 'firm' ? 'bg-indigo-50' : 'bg-amber-50'
              }`}>
                {lookupResult.type === 'firm'
                  ? <Building2 size={20} className="text-indigo-500" />
                  : <Users size={20} className="text-amber-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-semibold text-gray-900" style={{ letterSpacing: '-0.01em' }}>{lookupResult.name}</h4>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide ${
                    lookupResult.type === 'firm' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                  }`}>{lookupResult.type}</span>
                </div>
                {lookupResult.type === 'person' && lookupResult.firm && lookupResult.firm !== lookupResult.name && (
                  <p className="text-xs text-gray-500 mt-0.5">{lookupResult.role} at <span className="font-medium text-gray-700">{lookupResult.firm}</span></p>
                )}
                {lookupResult.description && (
                  <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{lookupResult.description}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={handleSaveLookup}
                  disabled={saved || existingNames.has(lookupResult.name.toLowerCase().trim())}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all active:scale-[0.97] ${
                    saved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    existingNames.has(lookupResult.name.toLowerCase().trim()) ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  }`}
                >
                  {saved ? <><Check size={12} /> Saved</> :
                   existingNames.has(lookupResult.name.toLowerCase().trim()) ? 'Already saved' :
                   <><Download size={12} /> Save</>}
                </button>
              </div>
            </div>

            {/* Meta tags row */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {lookupResult.stage && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-[11px] font-medium border border-gray-100">
                  <Target size={10} className="text-gray-400" /> {lookupResult.stage}
                </span>
              )}
              {lookupResult.checkSize && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-medium border border-emerald-100">
                  <DollarSign size={10} /> {lookupResult.checkSize}
                </span>
              )}
              {lookupResult.location && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-[11px] font-medium border border-gray-100">
                  <MapPin size={10} className="text-gray-400" /> {lookupResult.location}
                </span>
              )}
              {lookupResult.aum && (
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[11px] font-medium border border-purple-100">
                  AUM: {lookupResult.aum}
                </span>
              )}
            </div>

            {lookupResult.sectors?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {lookupResult.sectors.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-medium">{s}</span>
                ))}
              </div>
            )}

            {lookupResult.notableInvestments?.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-3">
                <span className="text-gray-500 font-medium">Portfolio:</span> {lookupResult.notableInvestments.join(', ')}
              </p>
            )}

            {/* Links row */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {lookupResult.website && (
                <a href={lookupResult.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                  <Globe size={12} /> Website
                </a>
              )}
              {lookupResult.linkedin && (
                <a href={lookupResult.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              {lookupResult.email && (
                <a href={`mailto:${lookupResult.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium font-mono transition-colors">
                  <Mail size={12} /> {lookupResult.email}
                </a>
              )}
              {/* Crawl CTA */}
              {(lookupResult.teamPageUrl || lookupResult.website) && !crawlResult && (
                <button
                  onClick={() => handleCrawlTeamPage(lookupResult.teamPageUrl || lookupResult.website)}
                  disabled={crawling}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.97]"
                >
                  {crawling ? <><Loader2 size={12} className="animate-spin" /> Scanning team page...</> :
                   <><Users size={12} /> Scan Team Page</>}
                </button>
              )}
            </div>
          </div>

          {/* Crawl results inline */}
          {crawlResult && <CrawlResultsView
            crawlResult={crawlResult}
            savedNames={savedNames}
            existingNames={existingNames}
            savingAll={savingAll}
            saveAllDone={saveAllDone}
            onSaveMember={handleSaveMember}
            onSaveAll={handleSaveAll}
            onCrawlLink={(url) => handleCrawlTeamPage(url)}
          />}
        </div>
      )}

      {/* Direct crawl results (URL was entered) */}
      {!lookupResult && crawlResult && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Globe size={18} className="text-indigo-500" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{crawlResult.title || crawlResult.domain}</h4>
                {crawlResult.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{crawlResult.description}</p>}
              </div>
            </div>
            <a href={crawlResult.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <ExternalLink size={14} />
            </a>
          </div>
          <CrawlResultsView
            crawlResult={crawlResult}
            savedNames={savedNames}
            existingNames={existingNames}
            savingAll={savingAll}
            saveAllDone={saveAllDone}
            onSaveMember={handleSaveMember}
            onSaveAll={handleSaveAll}
            onCrawlLink={(url) => { setInput(url); handleCrawlTeamPage(url); }}
          />
        </div>
      )}

      {/* Empty state — suggestions */}
      {!lookupResult && !crawlResult && !loading && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name suggestions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Sparkles size={13} className="text-indigo-500" />
              </div>
              <h4 className="text-xs font-semibold text-gray-700">AI Lookup</h4>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Type a firm or investor name — AI will find their details</p>
            <div className="flex flex-wrap gap-1.5">
              {['Sequoia Capital', 'a16z', 'Benchmark', 'First Round', 'Founders Fund', 'Greylock'].map(name => (
                <button
                  key={name}
                  onClick={() => setInput(name)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors font-medium"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* URL suggestions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Globe size={13} className="text-emerald-500" />
              </div>
              <h4 className="text-xs font-semibold text-gray-700">Crawl Team Page</h4>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Paste a /team URL to extract contacts and LinkedIn profiles</p>
            <div className="space-y-1">
              {[
                { label: 'a16z', url: 'https://a16z.com/about/' },
                { label: 'Sequoia', url: 'https://www.sequoiacap.com/people/' },
                { label: 'Greylock', url: 'https://greylock.com/team/' },
                { label: 'Accel', url: 'https://www.accel.com/people' },
                { label: 'Bessemer', url: 'https://www.bvp.com/team' },
                { label: 'First Round', url: 'https://firstround.com/team/' },
              ].map((s) => (
                <button
                  key={s.url}
                  onClick={() => setInput(s.url)}
                  className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-50/50 transition-colors group"
                >
                  <span className="text-[11px] text-gray-500 group-hover:text-gray-800 font-medium">{s.label}</span>
                  <span className="text-[10px] text-gray-300 group-hover:text-emerald-500 truncate ml-2 max-w-[150px]">{s.url.replace('https://', '').replace('www.', '')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Shared crawl results display */
function CrawlResultsView({
  crawlResult, savedNames, existingNames, savingAll, saveAllDone,
  onSaveMember, onSaveAll, onCrawlLink,
}: {
  crawlResult: CrawlResult;
  savedNames: Set<string>;
  existingNames: Set<string>;
  savingAll: boolean;
  saveAllDone?: boolean;
  onSaveMember: (name: string, role: string, email: string, linkedin: string) => void;
  onSaveAll: () => void;
  onCrawlLink: (url: string) => void;
}) {
  const totalFound = (crawlResult.teamMembers?.length || 0) + (crawlResult.linkedins?.length || 0) + (crawlResult.emails?.length || 0);

  return (
    <div className="border-t border-gray-100">
      {/* Stats ribbon */}
      <div className="flex items-center gap-3 px-5 sm:px-6 py-3 bg-gray-50/80">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-indigo-100 rounded-md flex items-center justify-center">
              <Users size={10} className="text-indigo-600" />
            </div>
            <span className="text-xs text-gray-600"><span className="font-semibold">{crawlResult.teamMembers?.length || 0}</span> people</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center">
              <Linkedin size={10} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-600"><span className="font-semibold">{crawlResult.linkedins.length}</span> LinkedIn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gray-200 rounded-md flex items-center justify-center">
              <Mail size={10} className="text-gray-600" />
            </div>
            <span className="text-xs text-gray-600"><span className="font-semibold">{crawlResult.emails.length}</span> emails</span>
          </div>
        </div>
        {totalFound > 0 && (
          <button
            onClick={onSaveAll}
            disabled={savingAll || saveAllDone}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-[0.97] shadow-sm ${
              saveAllDone
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
            }`}
          >
            {savingAll ? <><Loader2 size={12} className="animate-spin" /> Importing...</> :
             saveAllDone ? <><Check size={12} /> All Imported</> :
             <><Download size={12} /> Import All</>}
          </button>
        )}
      </div>

      {/* Team Members */}
      {(crawlResult.teamMembers?.length || 0) > 0 && (
        <div>
          <div className="px-5 sm:px-6 py-2 bg-white border-b border-gray-50">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Team Members
            </h4>
          </div>
          <div className="divide-y divide-gray-50">
            {crawlResult.teamMembers!.map((member, idx) => {
              const alreadyExists = existingNames.has(member.name.toLowerCase().trim());
              const justSaved = savedNames.has(member.name);
              return (
                <div key={idx} className="px-5 sm:px-6 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center flex-shrink-0 text-gray-500 font-semibold text-[11px] border border-gray-100">
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">
                          <Linkedin size={12} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {member.role && <span className="text-xs text-gray-400">{member.role}</span>}
                      {member.email && <span className="text-[11px] text-gray-400 font-mono">{member.email}</span>}
                    </div>
                  </div>
                  {alreadyExists && !justSaved ? (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md font-medium border border-amber-100">Exists</span>
                  ) : (
                    <button
                      onClick={() => onSaveMember(member.name, member.role, member.email, member.linkedin)}
                      disabled={justSaved}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                        justSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-200'
                      }`}
                    >
                      {justSaved ? <><Check size={11} /> Saved</> : '+ Save'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LinkedIn Profiles */}
      {crawlResult.linkedins.length > 0 && (
        <div>
          <div className="px-5 sm:px-6 py-2 bg-white border-t border-b border-gray-50">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LinkedIn Profiles</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {crawlResult.linkedins.map((li) => {
              const handle = li.split('/in/')[1]?.replace(/\/$/, '') || li;
              const displayName = handle.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <div key={li} className="px-5 sm:px-6 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <Linkedin size={14} className="text-blue-400 flex-shrink-0" />
                  <a href={li} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                    {displayName}
                  </a>
                  <button
                    onClick={() => onSaveMember(displayName, '', '', li)}
                    disabled={savedNames.has(displayName)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                      savedNames.has(displayName) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-200'
                    }`}
                  >
                    {savedNames.has(displayName) ? <><Check size={11} /> Saved</> : '+ Save'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emails */}
      {crawlResult.emails.length > 0 && (
        <div>
          <div className="px-5 sm:px-6 py-2 bg-white border-t border-b border-gray-50">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Emails</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {crawlResult.emails.map((email) => {
              const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
              return (
                <div key={email} className="px-5 sm:px-6 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm font-mono text-gray-600">{email}</span>
                  <button
                    onClick={() => onSaveMember(nameFromEmail, '', email, '')}
                    disabled={savedNames.has(nameFromEmail)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                      savedNames.has(nameFromEmail) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-200'
                    }`}
                  >
                    {savedNames.has(nameFromEmail) ? <><Check size={11} /> Saved</> : '+ Save'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {totalFound === 0 && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No team members found</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">This site may use JavaScript rendering. Try their /team or /about page instead.</p>
        </div>
      )}

      {/* Suggested team pages */}
      {(crawlResult.teamPageLinks?.length || 0) > 0 && (
        <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <h4 className="text-[11px] font-medium text-gray-500 mb-2">Other team pages found on this site</h4>
          <div className="space-y-0.5">
            {crawlResult.teamPageLinks!.map((link) => (
              <button
                key={link}
                onClick={() => onCrawlLink(link)}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
              >
                <span className="text-xs text-gray-500 group-hover:text-indigo-600 truncate font-medium">{link}</span>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-indigo-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Find VCs for Project (AI-Powered) ──────────────────────────

interface VCFirm {
  name: string;
  website: string;
  teamPageUrl: string;
  whyFit: string;
  stage: string;
  sectors: string[];
  location: string;
  notableInvestments: string[];
  checkSize: string;
  fitScore?: number;
}

type SortOption = 'fit' | 'name' | 'stage' | 'checkSize';
type CrawlStatus = { members: TeamMember[]; error?: string; imported?: boolean; importedCount?: number; skippedCount?: number; selectedMembers?: Set<number> };

function computeFitScore(firm: VCFirm, project: Project): number {
  let score = 50; // base score
  // Stage match
  const firmStage = (firm.stage || '').toLowerCase();
  const projStage = (project.stage || '').toLowerCase();
  if (firmStage && projStage) {
    if (firmStage.includes(projStage) || projStage.includes(firmStage)) score += 25;
    else if (firmStage.includes('seed') && projStage.includes('seed')) score += 25;
    else if (firmStage.includes('series') && projStage.includes('series')) score += 15;
    else score += 5;
  }
  // Sector overlap
  const projSectors = (project.sectors || []).map((s: string) => s.toLowerCase());
  const firmSectors = (firm.sectors || []).map(s => s.toLowerCase());
  const overlap = projSectors.filter((s: string) => firmSectors.some(fs => fs.includes(s) || s.includes(fs))).length;
  score += Math.min(overlap * 8, 25);
  return Math.min(score, 100);
}

const FIND_VC_CACHE_KEY = 'roundbase_find_vc_cache';

function saveFindVCCache(data: { firms: VCFirm[]; projectId: string; crawlStatus: Record<string, { members: TeamMember[]; error?: string; imported?: boolean }> ; previewFirm: string | null }) {
  try { sessionStorage.setItem(FIND_VC_CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function loadFindVCCache(): { firms: VCFirm[]; projectId: string; crawlStatus: Record<string, { members: TeamMember[]; error?: string; imported?: boolean }>; previewFirm: string | null } | null {
  try {
    const raw = sessionStorage.getItem(FIND_VC_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function FindVCsTab({ onImport }: { onImport: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [firms, setFirms] = useState<VCFirm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fit');
  const [filterStage, setFilterStage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refinement, setRefinement] = useState('');
  const [showRefine, setShowRefine] = useState(false);
  // Crawl state per firm
  const [crawlStatus, setCrawlStatus] = useState<Map<string, CrawlStatus>>(new Map());
  const [crawlingFirms, setCrawlingFirms] = useState<Set<string>>(new Set());
  const [previewFirm, setPreviewFirm] = useState<string | null>(null);
  // Bulk import progress
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  // Existing investors for dedup
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());
  // Track if cache was restored
  const [cacheRestored, setCacheRestored] = useState(false);

  useEffect(() => {
    getProjects().then((projs) => {
      setProjects(projs);
      // Restore cached search results
      const cache = loadFindVCCache();
      if (cache && cache.firms.length > 0) {
        const proj = projs.find(p => p.id === cache.projectId);
        if (proj) {
          setSelectedProject(proj);
          setFirms(cache.firms);
          setPreviewFirm(cache.previewFirm);
          // Restore crawl status (convert arrays back to Sets for selectedMembers)
          const restoredStatus = new Map<string, CrawlStatus>();
          for (const [key, val] of Object.entries(cache.crawlStatus)) {
            restoredStatus.set(key, {
              ...val,
              selectedMembers: new Set(val.members.map((_: TeamMember, i: number) => i)),
            });
          }
          setCrawlStatus(restoredStatus);
          setCacheRestored(true);
        }
      }
    });
    getInvestors().then((inv) => {
      setExistingNames(new Set(inv.map(i => i.name.toLowerCase().trim())));
    });
  }, []);

  // Persist search results to sessionStorage
  useEffect(() => {
    if (firms.length > 0 && selectedProject) {
      const serializedStatus: Record<string, { members: TeamMember[]; error?: string; imported?: boolean }> = {};
      crawlStatus.forEach((val, key) => {
        serializedStatus[key] = { members: val.members, error: val.error, imported: val.imported };
      });
      saveFindVCCache({
        firms,
        projectId: selectedProject.id,
        crawlStatus: serializedStatus,
        previewFirm,
      });
    }
  }, [firms, selectedProject, crawlStatus, previewFirm]);

  const refreshExisting = async () => {
    const inv = await getInvestors();
    setExistingNames(new Set(inv.map(i => i.name.toLowerCase().trim())));
  };

  const handleFindVCs = async (refineText?: string) => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    if (!refineText) {
      setFirms([]);
      setCrawlStatus(new Map());
      setPreviewFirm(null);
    }

    try {
      const existingInvestors = await getInvestors();
      const existingFirms = Array.from(new Set(existingInvestors.map(i => i.firm).filter(Boolean)));
      // Include already-found firms to avoid duplicates on "Find More"
      const alreadyFound = firms.map(f => f.name);

      const res = await fetch('/api/discover-vcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          existingFirms: [...existingFirms, ...alreadyFound],
          refinement: refineText || refinement || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const newFirms = (data.firms || []).map((f: VCFirm) => ({
          ...f,
          fitScore: f.fitScore || computeFitScore(f, selectedProject),
        }));
        if (refineText || firms.length > 0) {
          // Merge with existing, avoiding duplicates
          const existingNameSet = new Set(firms.map(f => f.name.toLowerCase()));
          const unique = newFirms.filter((f: VCFirm) => !existingNameSet.has(f.name.toLowerCase()));
          setFirms(prev => [...prev, ...unique]);
        } else {
          setFirms(newFirms);
          // Auto-preview top 3 firms by fitScore
          const top3 = [...newFirms]
            .sort((a: VCFirm, b: VCFirm) => (b.fitScore || 0) - (a.fitScore || 0))
            .slice(0, 3);
          if (top3.length > 0) {
            setPreviewFirm(top3[0].name);
            Promise.all(top3.map((f: VCFirm) => handleCrawlPreview(f, true)));
          }
        }
      }
    } catch {
      setError('Failed to find VCs. Please try again.');
    }
    setLoading(false);
    setShowRefine(false);
    setRefinement('');
  };

  const handleCrawlPreview = async (firm: VCFirm, autoPreview = false) => {
    setCrawlingFirms(prev => new Set(prev).add(firm.name));
    if (!autoPreview) setPreviewFirm(firm.name);
    try {
      const crawlUrl = firm.teamPageUrl || firm.website;
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        const members: TeamMember[] = data.teamMembers || [];
        const allSelected = new Set(members.map((_: TeamMember, i: number) => i));
        setCrawlStatus(prev => {
          const next = new Map(prev);
          next.set(firm.name, { members, selectedMembers: allSelected });
          return next;
        });
      } else {
        const errData = await res.json().catch(() => ({ error: 'Crawl failed' }));
        setCrawlStatus(prev => {
          const next = new Map(prev);
          next.set(firm.name, { members: [], error: errData.error || `Failed (${res.status})` });
          return next;
        });
      }
    } catch {
      setCrawlStatus(prev => {
        const next = new Map(prev);
        next.set(firm.name, { members: [], error: 'Network error — could not reach the site' });
        return next;
      });
    }
    setCrawlingFirms(prev => { const next = new Set(prev); next.delete(firm.name); return next; });
  };

  const handleImportSelected = async (firm: VCFirm) => {
    const status = crawlStatus.get(firm.name);
    if (!status) return;
    const selected = status.selectedMembers || new Set<number>();
    let savedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < status.members.length; i++) {
      if (!selected.has(i)) continue;
      const member = status.members[i];
      // Skip duplicates
      if (existingNames.has(member.name.toLowerCase().trim())) {
        skippedCount++;
        continue;
      }
      const inv: Investor = {
        id: uid(),
        name: member.name,
        firm: firm.name,
        role: member.role || '',
        email: member.email || '',
        linkedin: member.linkedin || '',
        checkSize: firm.checkSize || '',
        stage: firm.stage || '',
        sectors: firm.sectors || [],
        location: firm.location || '',
        introPath: '',
        notes: `${firm.whyFit}\nNotable investments: ${(firm.notableInvestments || []).join(', ')}`,
        source: `AI Discovery: ${firm.website}`,
        website: firm.website || '',
        createdAt: new Date().toISOString(),
      };
      await saveInvestor(inv);
      existingNames.add(member.name.toLowerCase().trim());
      savedCount++;
    }

    // If no members selected/found, save firm as entry
    if (savedCount === 0 && status.members.length === 0 && !existingNames.has(firm.name.toLowerCase().trim())) {
      const inv: Investor = {
        id: uid(),
        name: firm.name,
        firm: firm.name,
        role: 'Firm',
        email: '',
        linkedin: '',
        checkSize: firm.checkSize || '',
        stage: firm.stage || '',
        sectors: firm.sectors || [],
        location: firm.location || '',
        introPath: '',
        notes: `${firm.whyFit}\nTeam page: ${firm.teamPageUrl}\nNotable investments: ${(firm.notableInvestments || []).join(', ')}`,
        source: `AI Discovery`,
        website: firm.website || '',
        createdAt: new Date().toISOString(),
      };
      await saveInvestor(inv);
      existingNames.add(firm.name.toLowerCase().trim());
      savedCount = 1;
    }

    setCrawlStatus(prev => {
      const next = new Map(prev);
      const existing = next.get(firm.name);
      if (existing) next.set(firm.name, { ...existing, imported: true, importedCount: savedCount, skippedCount });
      return next;
    });
    await refreshExisting();
    onImport();
  };

  const handleBulkImport = async () => {
    const remaining = firms.filter(f => !crawlStatus.get(f.name)?.imported);
    setBulkImporting(true);
    setBulkProgress({ done: 0, total: remaining.length });

    for (let i = 0; i < remaining.length; i++) {
      const firm = remaining[i];
      // Crawl if not already crawled
      if (!crawlStatus.has(firm.name)) {
        await handleCrawlPreview(firm, true);
      }
      // Import
      await handleImportSelected(firm);
      setBulkProgress({ done: i + 1, total: remaining.length });
    }
    setBulkImporting(false);
  };

  const toggleMember = (firmName: string, memberIdx: number) => {
    setCrawlStatus(prev => {
      const next = new Map(prev);
      const status = next.get(firmName);
      if (!status) return next;
      const selected = new Set(status.selectedMembers);
      if (selected.has(memberIdx)) selected.delete(memberIdx);
      else selected.add(memberIdx);
      next.set(firmName, { ...status, selectedMembers: selected });
      return next;
    });
  };

  // Filter and sort firms
  const stages = Array.from(new Set(firms.map(f => f.stage).filter(Boolean)));
  let filtered = firms;
  if (filterStage) filtered = filtered.filter(f => f.stage === filterStage);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.sectors.some(s => s.toLowerCase().includes(q)) ||
      f.location.toLowerCase().includes(q)
    );
  }
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'fit') return (b.fitScore || 0) - (a.fitScore || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'stage') return a.stage.localeCompare(b.stage);
    return 0;
  });

  const importedCount = Array.from(crawlStatus.values()).filter(s => s.imported).length;

  // Project selection
  if (!selectedProject) {
    return (
      <div className="max-w-5xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI-Powered VC Discovery</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select a project to find matching investors with AI</p>
            </div>
          </div>

          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); sessionStorage.setItem('discover-project', p.id); }}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <ProjectLogo logoUrl={p.logoUrl} name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-medium border border-gray-100">{p.stage}</span>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <Target size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No projects yet</p>
                <p className="text-xs text-gray-400">Create a project first to discover investors</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="max-w-5xl">
      <button
        onClick={() => { setSelectedProject(null); setFirms([]); setError(''); setCrawlStatus(new Map()); setPreviewFirm(null); }}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors mb-4"
      >
        <ArrowLeft size={13} />
        Back to projects
      </button>

      {/* Project header + actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProjectLogo logoUrl={selectedProject.logoUrl} name={selectedProject.name} size="md" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{selectedProject.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-medium">{selectedProject.stage}</span>
                {selectedProject.raiseAmount && (
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[10px] font-medium border border-gray-100">{selectedProject.raiseAmount}</span>
                )}
                {selectedProject.sectors?.length > 0 && (
                  <span className="text-[10px] text-gray-400">{selectedProject.sectors.slice(0, 3).join(', ')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {firms.length > 0 && (
              <button
                onClick={() => setShowRefine(!showRefine)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border rounded-xl transition-all ${
                  showRefine ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Search size={12} />
                <span className="hidden sm:inline">Refine</span>
              </button>
            )}
            <button
              onClick={() => handleFindVCs()}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? 'Finding...' : firms.length > 0 ? 'Find More' : 'Find VCs'}
            </button>
          </div>
        </div>

        {/* Refine search */}
        {showRefine && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                placeholder='e.g. "more seed-stage", "focus on AI/ML", "European VCs"...'
                className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 bg-gray-50/50 focus:bg-white transition-all"
                onKeyDown={(e) => { if (e.key === 'Enter' && refinement.trim()) handleFindVCs(refinement); }}
              />
              <button
                onClick={() => refinement.trim() && handleFindVCs(refinement)}
                disabled={!refinement.trim() || loading}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-30 transition-all"
              >
                Search
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Describe what kind of VCs you want to find more of</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <X size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Loader2 size={28} className="mx-auto mb-3 text-gray-300 animate-spin" />
          <p className="text-sm font-medium text-gray-900">Finding the best VCs for {selectedProject.name}...</p>
          <p className="text-xs text-gray-400 mt-1">Analyzing stage, sectors, and investor fit</p>
        </div>
      )}

      {/* Firm Results */}
      {firms.length > 0 && !loading && (
        <div className="space-y-3">
          {/* Toolbar: search, filter, sort, bulk import */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search results..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-indigo-200 focus:ring-1 focus:ring-indigo-100 focus:bg-white transition-all"
                />
              </div>
              {stages.length > 1 && (
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="text-xs px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg outline-none cursor-pointer hover:border-gray-200 transition-colors"
                >
                  <option value="">All stages</option>
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg outline-none cursor-pointer hover:border-gray-200 transition-colors"
              >
                <option value="fit">Best fit</option>
                <option value="name">Name A-Z</option>
                <option value="stage">Stage</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 tabular-nums">
                {sorted.length} firm{sorted.length !== 1 ? 's' : ''}
                {importedCount > 0 && <span className="text-emerald-600 font-medium ml-1">({importedCount} imported)</span>}
              </span>
              <button
                onClick={handleBulkImport}
                disabled={bulkImporting || crawlingFirms.size > 0 || importedCount === firms.length}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all"
              >
                {bulkImporting ? (
                  <><Loader2 size={11} className="animate-spin" /> {bulkProgress.done}/{bulkProgress.total}</>
                ) : (
                  <><Download size={12} /> Import All</>
                )}
              </button>
            </div>
          </div>

          {/* Bulk progress bar */}
          {bulkImporting && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                <span>Importing firms...</span>
                <span>{bulkProgress.done} of {bulkProgress.total}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-300"
                  style={{ width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {sorted.map((firm, idx) => {
            const status = crawlStatus.get(firm.name);
            const isImported = status?.imported;
            const isCrawling = crawlingFirms.has(firm.name);
            const isPreview = previewFirm === firm.name && status && !status.error;
            const fitScore = firm.fitScore || 0;
            const fitColor = fitScore >= 80 ? 'text-green-600 bg-green-50' : fitScore >= 60 ? 'text-amber-600 bg-amber-50' : 'text-gray-500 bg-gray-50';

            return (
              <div
                key={idx}
                className={`bg-white border rounded-xl transition-all ${
                  isImported ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                }`}
              >
                {/* Firm card */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                        <h4 className="text-sm font-semibold text-gray-900">{firm.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${fitColor}`}>
                          {fitScore}% fit
                        </span>
                        {isImported && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                            <Check size={10} /> Imported
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{firm.whyFit}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {firm.stage && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            <Target size={9} /> {firm.stage}
                          </span>
                        )}
                        {firm.checkSize && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            <DollarSign size={9} /> {firm.checkSize}
                          </span>
                        )}
                        {firm.location && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            <MapPin size={9} /> {firm.location}
                          </span>
                        )}
                      </div>
                      {firm.sectors?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {firm.sectors.slice(0, 5).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">{s}</span>
                          ))}
                        </div>
                      )}
                      {firm.notableInvestments?.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-2">
                          Portfolio: {firm.notableInvestments.slice(0, 4).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {firm.website && (
                        <a
                          href={firm.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                        >
                          <Globe size={11} /> Website
                        </a>
                      )}
                      {!isImported && (
                        <button
                          onClick={() => status ? setPreviewFirm(previewFirm === firm.name ? null : firm.name) : handleCrawlPreview(firm)}
                          disabled={false}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                          {isCrawling ? (
                            <><Loader2 size={11} className="animate-spin" /> Scanning...</>
                          ) : status ? (
                            <><Users size={11} /> {status.members.length} people</>
                          ) : (
                            <><Search size={11} /> Preview Team</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Crawl error */}
                {status?.error && previewFirm === firm.name && (
                  <div className="mx-4 sm:mx-5 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2">
                    <X size={13} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Could not scan this firm&apos;s website</p>
                      <p className="mt-0.5 text-red-500">{status.error}</p>
                      <button
                        onClick={() => handleCrawlPreview(firm)}
                        className="mt-2 text-red-700 underline hover:no-underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Team preview panel */}
                {isPreview && !isImported && (
                  <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        {status.members.length > 0
                          ? `${status.members.length} team member${status.members.length !== 1 ? 's' : ''} found`
                          : 'No team members found — will import firm only'
                        }
                      </span>
                      {status.members.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const allSelected = new Set(status.members.map((_: TeamMember, i: number) => i));
                              setCrawlStatus(prev => {
                                const next = new Map(prev);
                                next.set(firm.name, { ...status, selectedMembers: allSelected });
                                return next;
                              });
                            }}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            Select all
                          </button>
                          <button
                            onClick={() => {
                              setCrawlStatus(prev => {
                                const next = new Map(prev);
                                next.set(firm.name, { ...status, selectedMembers: new Set<number>() });
                                return next;
                              });
                            }}
                            className="text-[11px] text-gray-400 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {status.members.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {status.members.map((m: TeamMember, i: number) => {
                          const isDuplicate = existingNames.has(m.name.toLowerCase().trim());
                          const isSelected = status.selectedMembers?.has(i) ?? true;
                          return (
                            <label
                              key={i}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                                isDuplicate ? 'opacity-50' : isSelected ? 'bg-white border border-gray-200' : 'hover:bg-white/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected && !isDuplicate}
                                disabled={isDuplicate}
                                onChange={() => toggleMember(firm.name, i)}
                                className="rounded border-gray-300 text-gray-900 w-3.5 h-3.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-900">{m.name}</span>
                                  {isDuplicate && (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Already imported</span>
                                  )}
                                </div>
                                {m.role && <p className="text-[11px] text-gray-400">{m.role}</p>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {m.email && <Mail size={11} className="text-gray-300" />}
                                {m.linkedin && <Linkedin size={11} className="text-gray-300" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => handleImportSelected(firm)}
                      disabled={isImported}
                      className={`mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isImported
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isImported ? (
                        <><Check size={12} /> Imported{status.importedCount ? ` ${status.importedCount}` : ''}{status.skippedCount ? ` (${status.skippedCount} duplicates skipped)` : ''}</>
                      ) : (
                        <><Download size={12} /> Import {status.members.length > 0
                          ? `${status.selectedMembers?.size || 0} selected`
                          : 'firm'}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Quick Lookup ────────────────────────────────────────────────

interface LookupResult {
  type: string;
  name: string;
  firm: string;
  role: string;
  website: string;
  teamPageUrl: string;
  description: string;
  stage: string;
  sectors: string[];
  location: string;
  checkSize: string;
  notableInvestments: string[];
  email: string;
  linkedin: string;
  aum: string;
}

// LookupTab removed — merged into ResearchTab above
