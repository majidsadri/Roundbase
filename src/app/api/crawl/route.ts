import { NextRequest, NextResponse } from 'next/server';

// Crawl a VC website or investor profile and extract structured data
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 422 }
      );
    }

    const html = await response.text();

    // Extract useful text content (strip tags)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit content size

    // Extract meta info
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);

    // Extract emails from page
    const emailMatches = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    const emails = Array.from(new Set(emailMatches || [])).filter(
      (e) => !e.includes('example') && !e.includes('test')
    );

    // Extract LinkedIn URLs
    const linkedinMatches = html.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/g);
    const linkedins = Array.from(new Set(linkedinMatches || []));

    // Try to extract structured VC info from common patterns
    const data = {
      url: parsedUrl.toString(),
      title: titleMatch?.[1]?.trim() || '',
      description: descMatch?.[1]?.trim() || '',
      textContent,
      emails,
      linkedins,
      domain: parsedUrl.hostname,
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crawl failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
