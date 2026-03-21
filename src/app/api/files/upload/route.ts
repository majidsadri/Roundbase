import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadToStorage } from '@/lib/supabase/storage';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string;
  const fileType = formData.get('type') as string || 'other';

  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and projectId required' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: auth.userId } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${auth.userId}/${projectId}/${timestamp}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { publicUrl } = await uploadToStorage(
      storagePath,
      buffer,
      file.type || 'application/octet-stream',
    );

    const record = await prisma.projectFile.create({
      data: {
        projectId,
        name: file.name,
        type: fileType,
        filePath: storagePath,
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ...record, dataUrl: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
