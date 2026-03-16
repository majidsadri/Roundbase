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
  saveParsedInvestors, uid,
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
  const [activeTab, setActiveTab] = useState<'nfx' | 'crawl' | 'lookup' | 'find'>('nfx');
  const [investorCount, setInvestorCount] = useState(0);

  useEffect(() => {
    getInvestors().then((inv) => setInvestorCount(inv.length));
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200/80 mb-5">
        {([
          { key: 'nfx' as const, label: 'NFX Signal' },
          { key: 'crawl' as const, label: 'Crawl Website' },
          { key: 'find' as const, label: 'Find VCs' },
          { key: 'lookup' as const, label: 'Quick Lookup' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-[13px] border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-400 self-center tabular-nums">
          {investorCount} in database
        </div>
      </div>

      {activeTab === 'nfx' && <NFXSignalTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
      {activeTab === 'crawl' && <CrawlTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
      {activeTab === 'find' && <FindVCsTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
      {activeTab === 'lookup' && <LookupTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
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

function NFXSignalTab({ onImport }: { onImport: () => void }) {
  const [step, setStep] = useState<Step>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [parsedInvestors, setParsedInvestors] = useState<ParsedInvestor[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [parseMode, setParseMode] = useState<'local' | 'ai'>('local');
  const [imported, setImported] = useState<number | null>(null);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const deckRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
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
      <div className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Select Project</h3>
          <p className="text-xs text-gray-400 mb-4">
            Choose which project these investors are for. We&apos;ll match investors to your project&apos;s stage and sector.
          </p>

          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProjectLogo logoUrl={project.logoUrl} name={project.name} size="sm" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{project.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{project.description}</div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">
                        {project.stage}
                      </span>
                    </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 group-hover:text-gray-500 transition-colors"
                  />
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
      <div className="max-w-2xl">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
        >
          <ArrowLeft size={14} />
          Back to project selection
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ClipboardPaste size={16} className="text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Import for {selectedProject?.name}</h3>
            </div>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">
              {selectedProject?.stage}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Paste investor data from{' '}
            <a
              href="https://signal.nfx.com/investors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              signal.nfx.com
            </a>{' '}
            or any investor table. We&apos;ll parse and match to {selectedProject?.name}.
          </p>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'Paste investor data here...\n\nSupported formats:\n- NFX Signal table (copy rows from the investor table)\n- Any structured investor list with names, firms, check sizes, etc.'}
            rows={14}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm font-mono text-gray-700 resize-none outline-none focus:border-gray-400 placeholder:text-gray-300"
          />

          {/* Deck attachment */}
          <div className="mt-3 flex items-center gap-3">
            <input
              ref={deckRef}
              type="file"
              accept=".pdf,.pptx,.ppt,.key,.png,.jpg"
              onChange={(e) => setDeckFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={() => deckRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <FileText size={14} />
              {deckFile ? deckFile.name : 'Attach Deck (optional)'}
            </button>
            {deckFile && (
              <button
                onClick={() => setDeckFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            {/* Parse mode toggle */}
            <div className="flex border border-gray-200 rounded-md overflow-hidden text-xs">
              <button
                onClick={() => setParseMode('local')}
                className={`px-3 py-1.5 transition-colors ${
                  parseMode === 'local'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Local Parse
              </button>
              <button
                onClick={() => setParseMode('ai')}
                className={`px-3 py-1.5 transition-colors ${
                  parseMode === 'ai'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                AI Parse (OpenAI)
              </button>
            </div>

            <button
              onClick={handleParse}
              disabled={!pasteText.trim() || loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Parsing...' : 'Parse & Preview'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Tips for NFX Signal</h4>
          <ul className="text-xs text-gray-400 space-y-1.5">
            <li>1. Filter by your sectors and stage on signal.nfx.com</li>
            <li>2. Select all rows on the page (Cmd+A on the table)</li>
            <li>3. Copy (Cmd+C) and paste here</li>
            <li>4. Use &quot;AI Parse&quot; for messy data (requires OPENAI_API_KEY in .env.local)</li>
          </ul>
        </div>
      </div>
    );
  }

  // ─── Step 3: Preview Table ───────────────────────────────

  return (
    <div>
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        <ArrowLeft size={14} />
        Back to paste
      </button>

      {imported !== null ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <Check size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Imported {imported} investor{imported !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Added to pipeline for {selectedProject?.name} in &quot;Researching&quot; stage.
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
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
          >
            Import More
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {parsedInvestors.length} investors parsed for {selectedProject?.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Matching: {selectedProject?.stage} stage &middot; Keywords: {getProjectKeywords(selectedProject!).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {selected.size} of {parsedInvestors.length} selected
              </span>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-30 transition-colors flex items-center gap-2"
              >
                <Download size={14} />
                Import Selected ({selected.size})
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

function CrawlTab({ onImport }: { onImport: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState('');
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const handleCrawl = async (crawlUrl?: string) => {
    const targetUrl = crawlUrl || url.trim();
    if (!targetUrl) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Crawl failed');
      } else {
        setResult(data);
        if (crawlUrl) setUrl(crawlUrl);
      }
    } catch {
      setError('Network error — the site may be blocking requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvestor = async (name: string, role: string, email: string, linkedin: string) => {
    const inv: Investor = {
      id: uid(),
      name,
      firm: result?.title || result?.domain || '',
      role,
      email,
      linkedin,
      checkSize: '',
      stage: '',
      sectors: [],
      location: '',
      introPath: '',
      notes: `Crawled from ${result?.url}`,
      source: `Crawl: ${result?.domain}`,
      website: result?.url || '',
      createdAt: new Date().toISOString(),
    };
    await saveInvestor(inv);
    setSavedNames(new Set(Array.from(savedNames).concat(name)));
    onImport();
  };

  const handleSaveAll = async () => {
    if (!result) return;
    setSavingAll(true);
    const members = result.teamMembers || [];
    for (const m of members) {
      if (!savedNames.has(m.name)) {
        await handleSaveInvestor(m.name, m.role, m.email, m.linkedin);
      }
    }
    // Also save any LinkedIn profiles not already in team members
    const teamLinkedins = new Set(members.map((m) => m.linkedin).filter(Boolean));
    for (const li of result.linkedins) {
      if (teamLinkedins.has(li)) continue;
      const handle = li.split('/in/')[1] || li;
      const displayName = handle.replace(/-/g, ' ');
      if (!savedNames.has(displayName)) {
        await handleSaveInvestor(displayName, '', '', li);
      }
    }
    setSavingAll(false);
  };

  const totalFound = (result?.teamMembers?.length || 0) + (result?.linkedins?.length || 0) + (result?.emails?.length || 0);

  return (
    <div className="max-w-3xl">
      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={16} className="text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Crawl VC Website</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Paste a VC firm&apos;s team or about page URL. We&apos;ll extract team members, LinkedIn profiles, and emails.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCrawl()}
              placeholder="https://a16z.com/about/ or any VC team page"
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
            />
          </div>
          <button
            onClick={() => handleCrawl()}
            disabled={loading || !url.trim()}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Crawling...' : 'Crawl'}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <X size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      {!result && !loading && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-medium text-gray-600 mb-3">Popular VC team pages</h4>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {[
                { label: 'a16z — Team', url: 'https://a16z.com/about/' },
                { label: 'Sequoia — People', url: 'https://www.sequoiacap.com/people/' },
                { label: 'Greylock — Team', url: 'https://greylock.com/team/' },
                { label: 'Benchmark — Team', url: 'https://www.benchmark.com/' },
                { label: 'Accel — Team', url: 'https://www.accel.com/people' },
                { label: 'Lightspeed — Team', url: 'https://lsvp.com/team/' },
                { label: 'Bessemer — Team', url: 'https://www.bvp.com/team' },
                { label: 'NEA — Team', url: 'https://www.nea.com/team' },
                { label: 'Founders Fund — Team', url: 'https://foundersfund.com/team/' },
                { label: 'Index Ventures — Team', url: 'https://www.indexventures.com/team' },
                { label: 'General Catalyst — Team', url: 'https://www.generalcatalyst.com/team' },
                { label: 'Khosla Ventures — Team', url: 'https://www.khoslaventures.com/team/' },
                { label: 'First Round — Team', url: 'https://firstround.com/team/' },
                { label: 'Y Combinator — People', url: 'https://www.ycombinator.com/people' },
                { label: 'Union Square — Team', url: 'https://www.usv.com/team/' },
                { label: 'Craft Ventures — Team', url: 'https://www.craftventures.com/team' },
              ].map((s) => (
                <button
                  key={s.url}
                  onClick={() => { setUrl(s.url); handleCrawl(s.url); }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{s.label}</span>
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <h4 className="text-xs font-medium text-gray-600 mb-3">Tips for best results</h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-300 font-bold">1.</span>
                Use the firm&apos;s <strong className="text-gray-500">/team</strong> or <strong className="text-gray-500">/people</strong> page for best results
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 font-bold">2.</span>
                Some sites use JS rendering — if no team found, try a different page
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 font-bold">3.</span>
                We auto-detect team page links — check the suggestions below results
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-3">
          {/* Page Info Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{result.title || result.domain}</h4>
                {result.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{result.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users size={12} />
                <span className="font-medium">{result.teamMembers?.length || 0}</span> team members
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Linkedin size={12} />
                <span className="font-medium">{result.linkedins.length}</span> LinkedIn
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail size={12} />
                <span className="font-medium">{result.emails.length}</span> emails
              </div>
              {totalFound > 0 && (
                <button
                  onClick={handleSaveAll}
                  disabled={savingAll}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {savingAll ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  {savingAll ? 'Saving...' : 'Save All'}
                </button>
              )}
            </div>
          </div>

          {/* Team Members */}
          {(result.teamMembers?.length || 0) > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Team Members ({result.teamMembers!.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-50">
                {result.teamMembers!.map((member, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400 font-medium text-sm">
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                        {member.linkedin && (
                          <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600">
                            <Linkedin size={12} />
                          </a>
                        )}
                      </div>
                      {member.role && (
                        <div className="text-xs text-gray-400 mt-0.5">{member.role}</div>
                      )}
                      {member.email && (
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{member.email}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleSaveInvestor(member.name, member.role, member.email, member.linkedin)}
                      disabled={savedNames.has(member.name)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        savedNames.has(member.name)
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {savedNames.has(member.name) ? (
                        <><Check size={12} /> Saved</>
                      ) : (
                        '+ Save'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn Profiles (not in team members) */}
          {result.linkedins.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  LinkedIn Profiles ({result.linkedins.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-50">
                {result.linkedins.map((li) => {
                  const handle = li.split('/in/')[1]?.replace(/\/$/, '') || li;
                  const displayName = handle.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  return (
                    <div key={li} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <Linkedin size={14} className="text-blue-400 flex-shrink-0" />
                      <a
                        href={li}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-gray-700 hover:text-gray-900 hover:underline"
                      >
                        {displayName}
                      </a>
                      <button
                        onClick={() => handleSaveInvestor(displayName, '', '', li)}
                        disabled={savedNames.has(displayName)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          savedNames.has(displayName)
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {savedNames.has(displayName) ? (
                          <><Check size={12} /> Saved</>
                        ) : (
                          '+ Save'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emails */}
          {result.emails.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email Addresses ({result.emails.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-50">
                {result.emails.map((email) => {
                  const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
                  return (
                    <div key={email} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-sm font-mono text-gray-700">{email}</span>
                      <button
                        onClick={() => handleSaveInvestor(nameFromEmail, '', email, '')}
                        disabled={savedNames.has(nameFromEmail)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          savedNames.has(nameFromEmail)
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {savedNames.has(nameFromEmail) ? (
                          <><Check size={12} /> Saved</>
                        ) : (
                          '+ Save'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results found */}
          {totalFound === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mb-2">
                <Search size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-1">No team members found on this page</p>
              <p className="text-xs text-gray-400">
                This site might use JavaScript rendering. Try the firm&apos;s /team or /about page instead.
              </p>
            </div>
          )}

          {/* Suggested Team Pages */}
          {(result.teamPageLinks?.length || 0) > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Team pages detected on this site
              </h4>
              <div className="space-y-1.5">
                {result.teamPageLinks!.map((link) => (
                  <button
                    key={link}
                    onClick={() => { setUrl(link); handleCrawl(link); }}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors group"
                  >
                    <span className="text-xs text-gray-500 group-hover:text-gray-800 truncate">{link}</span>
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Raw Content */}
          <details className="bg-white border border-gray-200 rounded-xl">
            <summary className="px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600">
              View raw page content
            </summary>
            <div className="px-4 pb-4">
              <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                {result.textContent.slice(0, 3000)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// ─── Quick Lookup ────────────────────────────────────────────────

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
}

function FindVCsTab({ onImport }: { onImport: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [firms, setFirms] = useState<VCFirm[]>([]);
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [crawledFirms, setCrawledFirms] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleFindVCs = async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    setFirms([]);
    setCrawledFirms(new Set());

    try {
      const existingInvestors = await getInvestors();
      const existingFirms = Array.from(new Set(existingInvestors.map(i => i.firm).filter(Boolean)));

      const res = await fetch('/api/discover-vcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: selectedProject, existingFirms }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setFirms(data.firms || []);
      }
    } catch {
      setError('Failed to find VCs. Please try again.');
    }
    setLoading(false);
  };

  const handleCrawlFirm = async (firm: VCFirm) => {
    setCrawling(firm.name);
    try {
      const crawlUrl = firm.teamPageUrl || firm.website;
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        const members = data.teamMembers || [];
        let savedCount = 0;

        for (const member of members) {
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
          savedCount++;
        }

        // If no team members found, save the firm as a single entry
        if (savedCount === 0) {
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
          savedCount = 1;
        }

        setCrawledFirms(prev => { const next = new Set(Array.from(prev)); next.add(firm.name); return next; });
        onImport();
      }
    } catch {
      // silently fail
    }
    setCrawling(null);
  };

  const handleCrawlAll = async () => {
    for (const firm of firms) {
      if (!crawledFirms.has(firm.name)) {
        await handleCrawlFirm(firm);
      }
    }
  };

  // Project selection
  if (!selectedProject) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">AI-Powered VC Discovery</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Select a project and we&apos;ll use AI to find the best matching VC firms, then crawl their team pages to import investors.
          </p>

          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <ProjectLogo logoUrl={p.logoUrl} name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">{p.stage}</span>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </button>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Target size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No projects yet. Create a project first.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="max-w-4xl">
      <button
        onClick={() => { setSelectedProject(null); setFirms([]); setError(''); }}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        <ArrowLeft size={14} />
        Back to projects
      </button>

      {/* Project header + search */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProjectLogo logoUrl={selectedProject.logoUrl} name={selectedProject.name} size="md" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{selectedProject.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{selectedProject.stage}</span>
                {selectedProject.raiseAmount && (
                  <>
                    <span className="text-gray-200">&middot;</span>
                    <span className="text-xs text-gray-400">{selectedProject.raiseAmount}</span>
                  </>
                )}
                {selectedProject.sectors?.length > 0 && (
                  <>
                    <span className="text-gray-200">&middot;</span>
                    <span className="text-xs text-gray-400">{selectedProject.sectors.slice(0, 3).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleFindVCs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Finding VCs...' : firms.length > 0 ? 'Find More VCs' : 'Find Matching VCs'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">{error}</div>
      )}

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Loader2 size={28} className="mx-auto mb-3 text-gray-300 animate-spin" />
          <p className="text-sm font-medium text-gray-900">Finding the best VCs for {selectedProject.name}...</p>
          <p className="text-xs text-gray-400 mt-1">Analyzing stage, sectors, and fit</p>
        </div>
      )}

      {/* Firm Results */}
      {firms.length > 0 && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{firms.length} VC firms found</p>
            <button
              onClick={handleCrawlAll}
              disabled={crawling !== null || crawledFirms.size === firms.length}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Download size={12} />
              Crawl & Import All
            </button>
          </div>

          {firms.map((firm, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-xl p-5 transition-all ${
                crawledFirms.has(firm.name) ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-gray-900">{firm.name}</h4>
                    {crawledFirms.has(firm.name) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                        <Check size={10} /> Imported
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{firm.whyFit}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
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
                  {!crawledFirms.has(firm.name) && (
                    <button
                      onClick={() => handleCrawlFirm(firm)}
                      disabled={crawling !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {crawling === firm.name ? (
                        <><Loader2 size={11} className="animate-spin" /> Crawling...</>
                      ) : (
                        <><ArrowRight size={11} /> Crawl & Import</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick Lookup ────────────────────────────────────────────────

function LookupTab({ onImport }: { onImport: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CrawlResult[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);

    const urls = [
      `https://www.google.com/search?q=${encodeURIComponent(query + ' VC investor site:linkedin.com/in')}`,
    ];

    const crawlResults: CrawlResult[] = [];
    for (const url of urls) {
      try {
        const res = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (res.ok) {
          crawlResults.push(await res.json());
        }
      } catch {
        // skip failed crawls
      }
    }

    setResults(crawlResults);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Search size={16} className="text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Quick Investor Lookup</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Search for a VC firm or investor by name. We&apos;ll crawl public sources to find their info.
        </p>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Sequoia Capital, or John Smith angel investor"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-30 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Search
          </button>
        </div>
      </div>

      {results.map((r, idx) => (
        <div key={idx} className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-1">{r.title || r.domain}</h4>
          <p className="text-xs text-gray-400 mb-2">{r.description}</p>
          {r.emails.length > 0 && (
            <p className="text-xs text-gray-500">
              Emails: {r.emails.join(', ')}
            </p>
          )}
          {r.linkedins.length > 0 && (
            <p className="text-xs text-gray-500">
              LinkedIn: {r.linkedins.length} profiles found
            </p>
          )}
          <pre className="mt-2 text-[11px] text-gray-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
            {r.textContent.slice(0, 1000)}
          </pre>
        </div>
      ))}
    </div>
  );
}
