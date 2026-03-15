import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string;
  const fileType = formData.get('type') as string || 'other';

  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and projectId required' }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', projectId);
  await mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${timestamp}-${safeName}`;
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const publicPath = `/uploads/${projectId}/${filename}`;

  const record = await prisma.projectFile.create({
    data: {
      projectId,
      name: file.name,
      type: fileType,
      filePath: publicPath,
      uploadedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    ...record,
    dataUrl: record.filePath, // backward compat
  });
}
