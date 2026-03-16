import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface TeamMember {
  name: string;
  role: string;
  email: string;
  linkedin: string;
  bio: string;
  imageUrl: string;
}

// Common VC role keywords
const ROLE_KEYWORDS = [
  'partner', 'managing', 'general', 'principal', 'director', 'vp',
  'vice president', 'investor', 'associate', 'venture', 'founding',
  'co-founder', 'founder', 'ceo', 'cio', 'cto', 'head', 'senior',
  'analyst', 'operating', 'chairman', 'advisor', 'board',
];

function looksLikeRole(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return ROLE_KEYWORDS.some((kw) => lower.includes(kw)) && lower.length < 100;
}

// Words that indicate this is NOT a person's name
const NOT_NAME_WORDS = [
  'the', 'explore', 'more', 'about', 'expert', 'news', 'menu', 'power', 'user',
  'latest', 'read', 'learn', 'view', 'see', 'all', 'our', 'get', 'join',
  'contact', 'home', 'blog', 'press', 'media', 'careers', 'login', 'sign',
  'subscribe', 'follow', 'share', 'back', 'next', 'previous', 'search',
  'filter', 'sort', 'show', 'hide', 'close', 'open', 'click', 'here',
  'portfolio', 'companies', 'investments', 'insights', 'resources',
];

function looksLikeName(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;
  if (/[<>{}[\]@#$%^&*()+=|\\/:;]/.test(trimmed)) return false;
  // Names are typically 2-4 words, capitalized
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  // At least first word should start with uppercase
  if (!/^[A-Z]/.test(words[0])) return false;
  // Filter out navigation/UI text
  const lower = trimmed.toLowerCase();
  if (NOT_NAME_WORDS.some(w => lower.startsWith(w + ' ') || lower === w)) return false;
  // Names shouldn't contain common non-name words
  if (/\b(by|for|with|from|into|and the|or the)\b/i.test(trimmed)) return false;
  // Each word in a name should be reasonably short (not a sentence fragment)
  if (words.some(w => w.length > 20)) return false;
  // At least 2 words should start with uppercase (both first and last name)
  const upperWords = words.filter(w => /^[A-Z]/.test(w));
  if (upperWords.length < 2) return false;
  return true;
}

function extractTeamFromHTML($: cheerio.CheerioAPI, baseUrl: string): TeamMember[] {
  const members: TeamMember[] = [];
  const seen = new Set<string>();

  // Strategy 1: Look for common team page patterns
  // Many VC sites use cards/grid items for team members
  const cardSelectors = [
    '.team-member', '.person', '.team-card', '.member', '.bio-card',
    '.team-grid > div', '.team-grid > li', '.team-list > div',
    '[class*="team"] [class*="card"]', '[class*="team"] [class*="member"]',
    '[class*="person"]', '[class*="profile"]',
    '.people-grid > div', '.people-list > div',
    'article[class*="team"]', 'article[class*="person"]',
    // Common WordPress/generic patterns
    '.wp-block-column', '.elementor-widget-wrap',
  ];

  for (const selector of cardSelectors) {
    $(selector).each((_, el) => {
      const card = $(el);
      const text = card.text().trim();
      if (text.length < 5 || text.length > 2000) return;

      // Try to find name (usually h2, h3, h4, or bold text)
      let name = '';
      const nameEl = card.find('h2, h3, h4, h5, [class*="name"], [class*="title"]:first, strong:first, b:first').first();
      if (nameEl.length) {
        name = nameEl.text().trim();
      }

      // Try to find role
      let role = '';
      const roleEl = card.find('[class*="role"], [class*="position"], [class*="title"]:last, [class*="job"], p:first, span:first').first();
      if (roleEl.length) {
        const roleText = roleEl.text().trim();
        if (looksLikeRole(roleText) && roleText !== name) {
          role = roleText;
        }
      }

      // If no role found from class-based selector, scan all text nodes
      if (!role) {
        card.find('p, span, div').each((_, child) => {
          if (role) return;
          const childText = $(child).text().trim();
          if (childText !== name && looksLikeRole(childText) && childText.length < 100) {
            role = childText;
          }
        });
      }

      // Extract LinkedIn from card
      let linkedin = '';
      card.find('a[href*="linkedin.com/in/"]').each((_, a) => {
        if (!linkedin) linkedin = $(a).attr('href') || '';
      });

      // Extract email from card
      let email = '';
      card.find('a[href^="mailto:"]').each((_, a) => {
        if (!email) email = ($(a).attr('href') || '').replace('mailto:', '');
      });

      // Extract bio snippet
      const bio = card.find('p').text().trim().slice(0, 300);

      // Extract image
      const img = card.find('img').first();
      let imageUrl = img.attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          imageUrl = new URL(imageUrl, baseUrl).toString();
        } catch { /* ignore */ }
      }

      if (name && looksLikeName(name) && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        members.push({ name, role, email, linkedin, bio, imageUrl });
      }
    });
  }

  // Strategy 2: If no cards found, try to find name-role pairs from text patterns
  if (members.length === 0) {
    // Look for headings followed by role text
    $('h2, h3, h4, h5').each((_, el) => {
      const heading = $(el);
      const name = heading.text().trim();
      if (!looksLikeName(name)) return;

      // Look at next sibling or parent's next text
      let role = '';
      const next = heading.next();
      if (next.length) {
        const nextText = next.text().trim();
        if (looksLikeRole(nextText)) {
          role = nextText;
        }
      }

      // Check for LinkedIn nearby
      let linkedin = '';
      const parent = heading.parent();
      parent.find('a[href*="linkedin.com/in/"]').each((_, a) => {
        if (!linkedin) linkedin = $(a).attr('href') || '';
      });

      let email = '';
      parent.find('a[href^="mailto:"]').each((_, a) => {
        if (!email) email = ($(a).attr('href') || '').replace('mailto:', '');
      });

      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        members.push({ name, role, email, linkedin, bio: '', imageUrl: '' });
      }
    });
  }

  // Strategy 3: Extract from all LinkedIn profile links on the page
  if (members.length === 0) {
    $('a[href*="linkedin.com/in/"]').each((_, el) => {
      const a = $(el);
      const href = a.attr('href') || '';
      const handle = href.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/)?.[1];
      if (!handle) return;

      // Try to get name from link text or nearby elements
      let name = a.text().trim();
      if (!looksLikeName(name)) {
        // Try parent context
        const parent = a.parent();
        const parentText = parent.text().trim().split('\n')[0].trim();
        if (looksLikeName(parentText)) name = parentText;
      }
      if (!looksLikeName(name)) {
        // Generate from handle
        name = handle.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        members.push({
          name,
          role: '',
          email: '',
          linkedin: href,
          bio: '',
          imageUrl: '',
        });
      }
    });
  }

  return members;
}

function extractTeamPageLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const teamUrls: string[] = [];
  const teamPatterns = /\b(team|people|about|partners|who-we-are|our-team|staff|leadership)\b/i;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().toLowerCase();
    const fullUrl = href.startsWith('http') ? href : (() => { try { return new URL(href, baseUrl).toString(); } catch { return ''; } })();

    if (!fullUrl) return;

    // Check if the link text or URL path suggests a team page
    if (teamPatterns.test(href) || teamPatterns.test(text)) {
      // Only include links from the same domain
      try {
        const linkDomain = new URL(fullUrl).hostname;
        const baseDomain = new URL(baseUrl).hostname;
        if (linkDomain === baseDomain && !teamUrls.includes(fullUrl)) {
          teamUrls.push(fullUrl);
        }
      } catch { /* skip */ }
    }
  });

  return teamUrls.slice(0, 5);
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: 422 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script/style tags for text extraction
    $('script, style, noscript, iframe').remove();

    // Extract metadata
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') || '';

    // Extract text content
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);

    // Extract emails from entire page (both text and mailto links)
    const emailsFromText = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const emailsFromLinks: string[] = [];
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = href.replace('mailto:', '').split('?')[0].trim();
      if (email) emailsFromLinks.push(email);
    });
    const emails = Array.from(new Set([...emailsFromLinks, ...emailsFromText]))
      .filter((e) => !e.includes('example') && !e.includes('test') && !e.includes('sentry'));

    // Extract LinkedIn URLs
    const linkedins: string[] = [];
    $('a[href*="linkedin.com/in/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
      if (match && !linkedins.includes(match[0])) linkedins.push(match[0]);
    });

    // Extract team members using structured HTML parsing
    let teamMembers = extractTeamFromHTML($, parsedUrl.toString());

    // Find links to team/people pages (for suggesting deeper crawl)
    const teamPageLinks = extractTeamPageLinks($, parsedUrl.toString());

    // Auto-follow: if no team members found and we found team page links, crawl them
    if (teamMembers.length === 0 && teamPageLinks.length > 0) {
      for (const teamUrl of teamPageLinks.slice(0, 3)) {
        try {
          const teamRes = await fetch(teamUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(15000),
          });
          if (!teamRes.ok) continue;
          const teamHtml = await teamRes.text();
          const $team = cheerio.load(teamHtml);
          $team('script, style, noscript, iframe').remove();
          const subMembers = extractTeamFromHTML($team, teamUrl);
          if (subMembers.length > 0) {
            teamMembers = subMembers;
            // Also extract linkedins/emails from team page
            $team('a[href*="linkedin.com/in/"]').each((_, el) => {
              const href = $team(el).attr('href') || '';
              const match = href.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
              if (match && !linkedins.includes(match[0])) linkedins.push(match[0]);
            });
            $team('a[href^="mailto:"]').each((_, el) => {
              const href = $team(el).attr('href') || '';
              const email = href.replace('mailto:', '').split('?')[0].trim();
              if (email && !emails.includes(email)) emails.push(email);
            });
            break; // Found members, stop trying other team pages
          }
        } catch { /* continue to next team page link */ }
      }
    }

    // AI fallback: if still no team members, use OpenAI to extract from text
    const apiKey = process.env.OPENAI_API_KEY;
    const looksLowQuality = teamMembers.length > 0 && teamMembers.every(m => !m.role);
    if ((teamMembers.length === 0 || looksLowQuality) && textContent.length > 200 && apiKey) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `Extract team members from this VC firm's webpage. Focus ONLY on people who work at the firm (partners, principals, associates, managing directors, etc.). Do NOT include:
- Article authors or guest contributors
- Portfolio company founders
- People mentioned in blog posts or news

Return a JSON object:
{"members":[{"name":"Full Name","role":"Partner/Principal/Associate/etc","email":"","linkedin":"","bio":"Short bio"}]}

If this appears to be a blog/news page rather than a team page, or if you cannot clearly identify firm team members, return {"members":[]}.`,
              },
              {
                role: 'user',
                content: `Page: ${title}\nURL: ${parsedUrl.toString()}\n\nContent:\n${textContent.slice(0, 5000)}`,
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const aiContent = aiData.choices?.[0]?.message?.content || '{"members":[]}';
          try {
            const parsed = JSON.parse(aiContent);
            const aiMembers = parsed.members || parsed;
            if (Array.isArray(aiMembers)) {
              teamMembers = aiMembers.map((m: { name: string; role?: string; email?: string; linkedin?: string; bio?: string }) => ({
                name: m.name || '',
                role: m.role || '',
                email: m.email || '',
                linkedin: m.linkedin || '',
                bio: m.bio || '',
                imageUrl: '',
              })).filter((m: TeamMember) => m.name);
            }
          } catch {
            // Try regex fallback
            const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const aiMembers = JSON.parse(jsonMatch[0]);
              teamMembers = aiMembers.map((m: { name: string; role?: string; email?: string; linkedin?: string; bio?: string }) => ({
                name: m.name || '',
                role: m.role || '',
                email: m.email || '',
                linkedin: m.linkedin || '',
                bio: m.bio || '',
                imageUrl: '',
              })).filter((m: TeamMember) => m.name);
            }
          }
        }
      } catch { /* AI extraction failed, continue with empty */ }
    }

    const data = {
      url: parsedUrl.toString(),
      title,
      description,
      textContent,
      emails,
      linkedins,
      domain: parsedUrl.hostname,
      teamMembers,
      teamPageLinks,
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crawl failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
