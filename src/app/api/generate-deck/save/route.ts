import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { projectId, htmlContent, fileName } = await req.json();

    if (!projectId || !htmlContent) {
      return NextResponse.json({ error: 'projectId and htmlContent required' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', projectId);
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = (fileName || 'pitch-deck').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}-${safeName}.html`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, htmlContent, 'utf-8');

    const publicPath = `/uploads/${projectId}/${filename}`;

    const record = await prisma.projectFile.create({
      data: {
        projectId,
        name: `${safeName}.html`,
        type: 'deck',
        filePath: publicPath,
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      ...record,
      dataUrl: record.filePath,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
