'use client';

import { useState, useRef } from 'react';
import {
  FolderOpen, Upload, FileText, Download, Trash2,
} from 'lucide-react';
import { Project, ProjectFile } from '@/types';
import { uploadFile, deleteFile, getProjects } from '@/lib/store';
import PitchDeckSection from '../../PitchDeckSection';

const FILE_TYPES = [
  { value: 'deck', label: 'Pitch Deck' },
  { value: 'pitch', label: 'Pitch Video' },
  { value: 'onepager', label: 'One-Pager' },
  { value: 'financials', label: 'Financials' },
  { value: 'other', label: 'Other' },
] as const;

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  } catch {
    window.open(url, '_blank');
  }
}

interface Props {
  project: Project;
  onUpdate: (p: Project) => void;
}

export default function FilesStep({ project, onUpdate }: Props) {
  const [uploadFileType, setUploadFileType] = useState('deck');
  const fileRef = useRef<HTMLInputElement>(null);

  const getFileTypeLabel = (type: string) => {
    return FILE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const handleUpload = async (file: File) => {
    await uploadFile(project.id, file, uploadFileType);
    const updated = (await getProjects()).find((p) => p.id === project.id);
    if (updated) onUpdate(updated);
  };

  const handleDelete = async (fileIdx: number) => {
    const file = project.files?.[fileIdx];
    if (file && (file as ProjectFile & { id?: string }).id) {
      await deleteFile((file as ProjectFile & { id?: string }).id!);
    }
    const updated = (await getProjects()).find((p) => p.id === project.id);
    if (updated) onUpdate(updated);
  };

  const handleFileSaved = async () => {
    const updated = (await getProjects()).find((p) => p.id === project.id);
    if (updated) onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {/* Files Section */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen size={14} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Pitch Materials & Files</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {project.files && project.files.length > 0 ? `${project.files.length} file${project.files.length !== 1 ? 's' : ''}` : 'No files yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={uploadFileType}
              onChange={(e) => setUploadFileType(e.target.value)}
              className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white"
            >
              {FILE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.pptx,.ppt,.key,.png,.jpg,.jpeg,.mp4,.mov,.doc,.docx,.xlsx,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Upload size={12} /> Upload
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {(!project.files || project.files.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No files uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Upload your pitch deck, one-pager, financials, or marketing materials</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                <Upload size={12} /> Upload File
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {project.files.map((f, idx) => (
                <div
                  key={(f as ProjectFile & { id?: string }).id || idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50 group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {getFileTypeLabel(f.type)} &middot; {new Date(f.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <button
                      onClick={() => downloadFile(f.dataUrl, f.name)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pitch Deck Generator */}
      <PitchDeckSection project={project} onFileSaved={handleFileSaved} />
    </div>
  );
}
