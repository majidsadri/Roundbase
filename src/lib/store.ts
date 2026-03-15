import { Investor, PipelineEntry, Activity, Project, ParsedInvestor } from '@/types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function safeJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// ─── Investors ────────────────────────────────────────────────────

export async function getInvestors(): Promise<Investor[]> {
  const res = await fetch('/api/investors');
  return safeJson(res, []);
}

export async function saveInvestor(investor: Investor): Promise<void> {
  await fetch('/api/investors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(investor),
  });
}

export async function deleteInvestor(id: string): Promise<void> {
  await fetch(`/api/investors/${id}`, { method: 'DELETE' });
}

// ─── Pipeline ─────────────────────────────────────────────────────

export async function getPipeline(projectId?: string): Promise<PipelineEntry[]> {
  const url = projectId ? `/api/pipeline?projectId=${projectId}` : '/api/pipeline';
  const res = await fetch(url);
  return safeJson(res, []);
}

export async function savePipelineEntry(entry: PipelineEntry): Promise<void> {
  await fetch('/api/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export async function deletePipelineEntry(id: string): Promise<void> {
  await fetch(`/api/pipeline/${id}`, { method: 'DELETE' });
}

// ─── Activities ───────────────────────────────────────────────────

export async function getActivities(pipelineId?: string): Promise<Activity[]> {
  const url = pipelineId ? `/api/activities?pipelineId=${pipelineId}` : '/api/activities';
  const res = await fetch(url);
  return safeJson(res, []);
}

export async function saveActivity(activity: Activity): Promise<void> {
  await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  });
}

// ─── Projects ─────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  return safeJson(res, []);
}

export async function saveProject(project: Project): Promise<void> {
  await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
}

// ─── File Upload ──────────────────────────────────────────────────

export async function uploadFile(
  projectId: string,
  file: File,
  type: string
): Promise<{ id: string; name: string; type: string; filePath: string; dataUrl: string; uploadedAt: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  formData.append('type', type);
  const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
  return safeJson(res, { id: '', name: '', type: '', filePath: '', dataUrl: '', uploadedAt: '' });
}

export async function deleteFile(fileId: string): Promise<void> {
  await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
}

// ─── CSV Import ───────────────────────────────────────────────────

export async function importInvestorsCSV(csvText: string): Promise<number> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return 0;

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const investors: Investor[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const investor: Investor = {
      id: uid(),
      name: row['name'] || row['investor'] || row['contact'] || '',
      firm: row['firm'] || row['fund'] || row['company'] || '',
      role: row['role'] || row['title'] || '',
      email: row['email'] || '',
      linkedin: row['linkedin'] || row['linkedin_url'] || '',
      checkSize: row['check size'] || row['check_size'] || row['amount'] || '',
      stage: row['stage'] || '',
      sectors: (row['sectors'] || row['sector'] || '').split(';').map((s) => s.trim()).filter(Boolean),
      location: row['location'] || row['city'] || '',
      introPath: row['intro'] || row['intro_path'] || '',
      notes: row['notes'] || '',
      source: row['source'] || 'CSV Import',
      website: row['website'] || row['url'] || '',
      createdAt: new Date().toISOString(),
    };

    if (investor.name) investors.push(investor);
  }

  if (investors.length > 0) {
    await fetch('/api/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investors),
    });
  }

  return investors.length;
}

// ─── NFX Signal Paste Parser ──────────────────────────────────────

export function parseNFXSignalTable(text: string): ParsedInvestor[] {
  const investors: ParsedInvestor[] = [];
  const blocks = text.split(/(?=Photo of )/i).filter((b) => b.trim().length > 10);

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const parsed: ParsedInvestor = {
      name: '', firm: '', role: '', introStrength: '',
      checkSize: '', checkRange: '', locations: [], categories: [],
    };

    const photoMatch = lines[0].match(/^Photo of (.+?)(?:,\s*(.+?)\s+at\s+(.+))?$/i);
    if (photoMatch) {
      parsed.name = photoMatch[1].trim();
      if (photoMatch[2]) parsed.role = photoMatch[2].trim();
      if (photoMatch[3]) parsed.firm = photoMatch[3].trim();
    }

    let i = 1;
    if (i < lines.length && !lines[i].startsWith('$') && !lines[i].startsWith('(')) {
      if (!parsed.name) parsed.name = lines[i];
      i++;
    }
    if (i < lines.length && !lines[i].startsWith('$') && !lines[i].startsWith('(') && !lines[i].match(/^(n\/a|Partner|Managing|General|Principal|Director|VP|Investor)/i)) {
      if (!parsed.firm) parsed.firm = lines[i];
      i++;
    }
    if (i < lines.length && lines[i].match(/^(Managing|General|Partner|Principal|Director|VP|Investor|Venture|Associate|Founding|Co-Founder|CEO|CIO|Head|Senior|Junior|Investment)/i)) {
      if (!parsed.role) parsed.role = lines[i];
      i++;
    }

    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Photo of')) continue;
      if (/^\+\d+$/.test(line)) continue;
      if (line === 'n/a' && !parsed.introStrength) { parsed.introStrength = 'n/a'; continue; }
      if (line.match(/^\$[\d.,]+[KkMmBb]?$/)) { parsed.checkSize = line; continue; }
      if (line.match(/^\(?\$[\d.,]+[KkMmBb]?\s*[-–]\s*\$[\d.,]+[KkMmBb]?\)?$/)) { parsed.checkRange = line.replace(/[()]/g, ''); continue; }
      if (line.match(/^Investors in .+/) && !line.match(/Investors in .+\((?:Seed|Pre-seed|Series|Angel|Other)/i)) {
        const locs = line.split(',').map((l) => l.replace(/^Investors in\s*/i, '').trim()).filter(Boolean);
        parsed.locations.push(...locs);
        continue;
      }
      if (line.match(/Investors in .+\((?:Seed|Pre-seed|Series|Angel|Other)/i)) {
        const cats = line.split(',').map((c) => c.replace(/^Investors in\s*/i, '').trim()).filter(Boolean);
        parsed.categories.push(...cats);
        continue;
      }
    }

    parsed.categories = Array.from(new Set(parsed.categories));
    parsed.locations = Array.from(new Set(parsed.locations));
    if (parsed.name) investors.push(parsed);
  }

  return investors;
}

export function extractSectors(categories: string[]): string[] {
  const sectors = categories
    .map((c) => c.replace(/\s*\((?:Seed|Pre-seed|Pre-Seed|Series [A-Z]|Angel|Other Lists|Other)\)\s*$/i, '').trim())
    .filter(Boolean);
  return Array.from(new Set(sectors));
}

export function extractStages(categories: string[]): string[] {
  const stages = categories
    .map((c) => {
      const match = c.match(/\((Seed|Pre-seed|Pre-Seed|Series [A-Z]|Angel)\)$/i);
      return match ? match[1] : null;
    })
    .filter((s): s is string => s !== null);
  return Array.from(new Set(stages));
}

export function scoreInvestorMatch(
  investor: ParsedInvestor,
  projectStage: string,
  projectKeywords: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const investorStages = extractStages(investor.categories).map((s) => s.toLowerCase());
  const pStage = projectStage.toLowerCase();

  if (investorStages.some((s) => s === pStage || s.includes(pStage) || pStage.includes(s))) {
    score += 40;
    reasons.push(`Invests at ${projectStage}`);
  }

  const investorSectors = extractSectors(investor.categories).map((s) => s.toLowerCase());
  const matchedKeywords: string[] = [];

  for (const keyword of projectKeywords) {
    const kw = keyword.toLowerCase();
    if (investorSectors.some((s) => s.includes(kw) || kw.includes(s))) {
      matchedKeywords.push(keyword);
    }
  }

  if (matchedKeywords.length > 0) {
    score += Math.min(matchedKeywords.length * 15, 60);
    reasons.push(`Sectors: ${matchedKeywords.join(', ')}`);
  }

  return { score: Math.min(score, 100), reasons };
}

export function scoreInvestorForProject(
  investor: Investor,
  project: Project
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (investor.stage && project.stage) {
    const invStages = investor.stage.toLowerCase().split(/[,;/]+/).map((s) => s.trim());
    const pStage = project.stage.toLowerCase();
    if (invStages.some((s) => s === pStage || s.includes(pStage) || pStage.includes(s))) {
      score += 40;
      reasons.push(`Invests at ${project.stage}`);
    }
  }

  if (investor.sectors.length > 0 && project.sectors.length > 0) {
    const invSectors = investor.sectors.map((s) => s.toLowerCase());
    const matched: string[] = [];
    for (const ps of project.sectors) {
      const psLow = ps.toLowerCase();
      if (invSectors.some((is) => is.includes(psLow) || psLow.includes(is))) {
        matched.push(ps);
      }
    }
    if (matched.length > 0) {
      score += Math.min(matched.length * 15, 40);
      reasons.push(`Sectors: ${matched.join(', ')}`);
    }
  }

  if (investor.location && project.location) {
    const invLoc = investor.location.toLowerCase();
    const projLoc = project.location.toLowerCase();
    if (invLoc.includes(projLoc) || projLoc.includes(invLoc)) {
      score += 10;
      reasons.push(`Same region: ${project.location}`);
    }
  }

  if (investor.checkSize) {
    score += 10;
    reasons.push(`Check: ${investor.checkSize}`);
  }

  return { score: Math.min(score, 100), reasons };
}

export async function getRecommendedInvestors(
  projectId: string,
  limit = 20
): Promise<{ investor: Investor; score: number; reasons: string[] }[]> {
  const [projects, investors, pipeline] = await Promise.all([
    getProjects(),
    getInvestors(),
    getPipeline(projectId),
  ]);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return [];

  const pipelineIds = new Set(pipeline.map((e) => e.investorId));

  const scored = investors
    .filter((inv) => !pipelineIds.has(inv.id))
    .map((inv) => {
      const { score, reasons } = scoreInvestorForProject(inv, project);
      return { investor: inv, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

export async function saveParsedInvestors(
  parsed: ParsedInvestor[],
  projectId: string
): Promise<number> {
  let count = 0;
  for (const p of parsed) {
    const sectors = extractSectors(p.categories);
    const stages = extractStages(p.categories);

    const investor: Investor = {
      id: uid(),
      name: p.name,
      firm: p.firm,
      role: p.role,
      email: '',
      linkedin: '',
      checkSize: p.checkRange ? `${p.checkSize} (${p.checkRange})` : p.checkSize,
      stage: stages.join(', '),
      sectors,
      location: p.locations.join(', '),
      introPath: p.introStrength,
      notes: '',
      source: 'NFX Signal',
      website: '',
      createdAt: new Date().toISOString(),
    };

    if (investor.name) {
      await saveInvestor(investor);
      await savePipelineEntry({
        id: uid(),
        projectId,
        investorId: investor.id,
        stage: 'researching',
        notes: '',
        lastContact: '',
        nextFollowup: '',
        createdAt: new Date().toISOString(),
      });
      count++;
    }
  }
  return count;
}

// Legacy parsers kept for backward compat
export async function importNFXSignalPaste(text: string): Promise<number> {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  let count = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (
      line.length > 1 &&
      !line.startsWith('#') &&
      !line.toLowerCase().startsWith('showing') &&
      !line.toLowerCase().startsWith('filter')
    ) {
      const investor: Investor = {
        id: uid(), name: '', firm: '', role: '', email: '', linkedin: '',
        checkSize: '', stage: '', sectors: [], location: '', introPath: '',
        notes: '', source: 'NFX Signal', website: '', createdAt: new Date().toISOString(),
      };

      investor.name = line;
      i++;

      let fieldCount = 0;
      while (i < lines.length && lines[i].trim() && fieldCount < 6) {
        const val = lines[i].trim();
        if (val.match(/\$[\d.,]+[KkMmBb]/i) || val.match(/^\d[\d,.]* *[-–] *\d/)) {
          investor.checkSize = val;
        } else if (val.match(/(seed|series|pre-seed|angel|growth|venture|early)/i) && val.length < 40) {
          investor.stage = val;
        } else if (val.match(/(CA|NY|TX|SF|LA|US|UK|London|Boston|NYC|Chicago|Austin|Miami|India)/i) && val.length < 60) {
          investor.location = val;
        } else if (val.includes(',') && val.length > 10 && !investor.firm) {
          investor.sectors = val.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (!investor.firm) {
          investor.firm = val;
        } else if (investor.sectors.length === 0) {
          investor.sectors = val.split(',').map((s) => s.trim()).filter(Boolean);
        }
        i++;
        fieldCount++;
      }

      if (investor.name && investor.name.length > 1) {
        await saveInvestor(investor);
        count++;
      }
    } else {
      i++;
    }
  }

  return count;
}

export async function importNFXSignalJSON(data: Array<Record<string, string>>): Promise<number> {
  let count = 0;
  for (const row of data) {
    const investor: Investor = {
      id: uid(),
      name: row.name || row.investor_name || '',
      firm: row.firm || row.fund || row.organization || '',
      role: row.role || row.title || '',
      email: row.email || '',
      linkedin: row.linkedin || row.linkedin_url || '',
      checkSize: row.check_size || row.sweet_spot || row.amount || '',
      stage: row.stage || row.stages || '',
      sectors: (row.sectors || row.industries || '').split(',').map((s) => s.trim()).filter(Boolean),
      location: row.location || row.city || row.geo || '',
      introPath: row.intro_strength || row.intro || '',
      notes: row.notes || '',
      source: 'NFX Signal',
      website: row.website || row.url || '',
      createdAt: new Date().toISOString(),
    };
    if (investor.name) {
      await saveInvestor(investor);
      count++;
    }
  }
  return count;
}
