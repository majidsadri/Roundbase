import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadToStorage } from '@/lib/supabase/storage';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { projectId, htmlContent, fileName } = await req.json();

    if (!projectId || !htmlContent) {
      return NextResponse.json({ error: 'projectId and htmlContent required' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: auth.userId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const timestamp = Date.now();
    const safeName = (fileName || 'pitch-deck').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${auth.userId}/${projectId}/${timestamp}-${safeName}.html`;
    const buffer = Buffer.from(htmlContent, 'utf-8');

    const { publicUrl } = await uploadToStorage(storagePath, buffer, 'text/html');

    const record = await prisma.projectFile.create({
      data: {
        projectId,
        name: `${safeName}.html`,
        type: 'deck',
        filePath: storagePath,
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ...record, dataUrl: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
