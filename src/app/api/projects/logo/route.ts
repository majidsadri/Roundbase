import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Fetch logo from a website URL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle logo upload (base64)
    if (body.projectId && body.logoData) {
      const { projectId, logoData, fileName } = body;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', projectId);
      await mkdir(uploadsDir, { recursive: true });

      // Save the logo file
      const ext = fileName?.split('.').pop() || 'png';
      const timestamp = Date.now();
      const logoFileName = `logo_${timestamp}.${ext}`;
      const filePath = path.join(uploadsDir, logoFileName);

      // logoData is base64
      const buffer = Buffer.from(logoData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      await writeFile(filePath, buffer);

      const logoUrl = `/uploads/${projectId}/${logoFileName}`;

      // Update project
      await prisma.project.update({
        where: { id: projectId },
        data: { logoUrl },
      });

      return NextResponse.json({ logoUrl });
    }

    // Handle fetch from website URL
    if (body.url && body.projectId) {
      const { url, projectId } = body;
      const logoUrl = await fetchLogoFromUrl(url);

      if (logoUrl) {
        // Download and save the logo locally
        const savedUrl = await downloadAndSaveLogo(logoUrl, projectId);
        if (savedUrl) {
          await prisma.project.update({
            where: { id: projectId },
            data: { logoUrl: savedUrl },
          });
          return NextResponse.json({ logoUrl: savedUrl });
        }

        // Fallback: use the external URL directly
        await prisma.project.update({
          where: { id: projectId },
          data: { logoUrl },
        });
        return NextResponse.json({ logoUrl });
      }

      return NextResponse.json({ logoUrl: '' });
    }

    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch logo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchLogoFromUrl(websiteUrl: string): Promise<string> {
  try {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      return '';
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return '';

    const html = await response.text();
    const $ = cheerio.load(html);

    // Priority order for finding logos:
    // 1. Apple touch icon (usually high quality, square)
    const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href') ||
      $('link[rel="apple-touch-icon-precomposed"]').attr('href');
    if (appleTouchIcon) return resolveUrl(appleTouchIcon, parsedUrl);

    // 2. Open Graph image (good quality, might be wide)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) return resolveUrl(ogImage, parsedUrl);

    // 3. Favicon with sizes (prefer larger)
    const iconLinks = $('link[rel="icon"][sizes], link[rel="shortcut icon"]');
    let bestIcon = '';
    let bestSize = 0;
    iconLinks.each((_, el) => {
      const href = $(el).attr('href');
      const sizes = $(el).attr('sizes') || '';
      const size = parseInt(sizes.split('x')[0]) || 0;
      if (href && size > bestSize) {
        bestSize = size;
        bestIcon = href;
      }
    });
    if (bestIcon) return resolveUrl(bestIcon, parsedUrl);

    // 4. Any favicon
    const favicon = $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href');
    if (favicon) return resolveUrl(favicon, parsedUrl);

    // 5. Default /favicon.ico
    return `${parsedUrl.origin}/favicon.ico`;
  } catch {
    return '';
  }
}

function resolveUrl(href: string, base: URL): string {
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return `${base.protocol}${href}`;
  try {
    return new URL(href, base.origin).toString();
  } catch {
    return '';
  }
}

async function downloadAndSaveLogo(logoUrl: string, projectId: string): Promise<string | null> {
  try {
    const res = await fetch(logoUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image') && !logoUrl.endsWith('.ico') && !logoUrl.endsWith('.svg')) {
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) return null; // Too small, probably not a real image

    // Determine extension
    let ext = 'png';
    if (contentType.includes('svg')) ext = 'svg';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
    else if (contentType.includes('ico')) ext = 'ico';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (logoUrl.match(/\.(png|jpg|jpeg|svg|ico|webp)(\?|$)/i)) {
      ext = logoUrl.match(/\.(png|jpg|jpeg|svg|ico|webp)/i)![1];
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', projectId);
    await mkdir(uploadsDir, { recursive: true });
    const timestamp = Date.now();
    const fileName = `logo_${timestamp}.${ext}`;
    await writeFile(path.join(uploadsDir, fileName), buffer);

    return `/uploads/${projectId}/${fileName}`;
  } catch {
    return null;
  }
}
