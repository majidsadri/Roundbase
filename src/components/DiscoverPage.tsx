'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Globe, Search, Download, ExternalLink, Loader2, ClipboardPaste, Link,
  ChevronRight, Check, X, Upload, FileText, Star, ArrowLeft,
} from 'lucide-react';
import { Investor, ParsedInvestor, Project } from '@/types';
import {
  saveInvestor, getInvestors, getProjects, saveProject,
  parseNFXSignalTable, scoreInvestorMatch, extractSectors, extractStages,
  saveParsedInvestors, uid,
} from '@/lib/store';

interface CrawlResult {
  url: string;
  title: string;
  description: string;
  textContent: string;
  emails: string[];
  linkedins: string[];
  domain: string;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<'nfx' | 'crawl' | 'lookup'>('nfx');
  const [investorCount, setInvestorCount] = useState(0);

  useEffect(() => {
    getInvestors().then((inv) => setInvestorCount(inv.length));
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {([
          { key: 'nfx' as const, label: 'NFX Signal Import' },
          { key: 'crawl' as const, label: 'Crawl VC Website' },
          { key: 'lookup' as const, label: 'Quick Lookup' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-400 self-center">
          {investorCount} investors in database
        </div>
      </div>

      {activeTab === 'nfx' && <NFXSignalTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
      {activeTab === 'crawl' && <CrawlTab onImport={() => { getInvestors().then((inv) => setInvestorCount(inv.length)); }} />}
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
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{project.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{project.description}</div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">
                        {project.stage}
                      </span>
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

  const handleCrawl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Crawl failed');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvestor = async (name: string, email: string, linkedin: string) => {
    const inv: Investor = {
      id: uid(),
      name,
      firm: result?.title || result?.domain || '',
      role: '',
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

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={16} className="text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Crawl VC Website</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Enter a VC firm&apos;s website or team page to extract investor contact info.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCrawl()}
              placeholder="https://www.sequoiacap.com/people/"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
          <button
            onClick={handleCrawl}
            disabled={loading || !url.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-30 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Crawling...' : 'Crawl'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-gray-600">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">{result.title || result.domain}</h4>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <ExternalLink size={14} />
              </a>
            </div>
            {result.description && (
              <p className="text-xs text-gray-500 mb-3">{result.description}</p>
            )}

            {result.emails.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Emails found ({result.emails.length})
                </p>
                <div className="space-y-1">
                  {result.emails.map((email) => (
                    <div key={email} className="flex items-center justify-between py-1">
                      <span className="text-sm font-mono text-gray-700">{email}</span>
                      <button
                        onClick={() =>
                          handleSaveInvestor(
                            email.split('@')[0].replace(/[._]/g, ' '),
                            email,
                            ''
                          )
                        }
                        disabled={savedNames.has(email.split('@')[0].replace(/[._]/g, ' '))}
                        className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        {savedNames.has(email.split('@')[0].replace(/[._]/g, ' '))
                          ? 'Saved'
                          : '+ Save'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.linkedins.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  LinkedIn profiles ({result.linkedins.length})
                </p>
                <div className="space-y-1">
                  {result.linkedins.map((li) => {
                    const handle = li.split('/in/')[1] || li;
                    const displayName = handle.replace(/-/g, ' ');
                    return (
                      <div key={li} className="flex items-center justify-between py-1">
                        <a
                          href={li}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:underline"
                        >
                          {displayName}
                        </a>
                        <button
                          onClick={() => handleSaveInvestor(displayName, '', li)}
                          disabled={savedNames.has(displayName)}
                          className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        >
                          {savedNames.has(displayName) ? 'Saved' : '+ Save'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.emails.length === 0 && result.linkedins.length === 0 && (
              <p className="text-xs text-gray-400">No emails or LinkedIn profiles found on this page.</p>
            )}
          </div>

          <details className="bg-white border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              Raw page content (preview)
            </summary>
            <div className="px-4 pb-4">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result.textContent.slice(0, 3000)}
              </pre>
            </div>
          </details>
        </div>
      )}

      <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
        <h4 className="text-xs font-medium text-gray-600 mb-2">Try crawling</h4>
        <div className="space-y-1.5">
          {[
            { label: 'NFX Signal — Investor directory', url: 'https://signal.nfx.com/investors' },
            { label: 'Y Combinator — Companies page', url: 'https://www.ycombinator.com/companies' },
          ].map((s) => (
            <button
              key={s.url}
              onClick={() => setUrl(s.url)}
              className="block text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
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
