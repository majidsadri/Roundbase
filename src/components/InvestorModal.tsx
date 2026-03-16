'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Investor } from '@/types';
import { uid } from '@/lib/store';

interface Props {
  investor?: Investor | null;
  onSave: (investor: Investor) => void;
  onClose: () => void;
}

export default function InvestorModal({ investor, onSave, onClose }: Props) {
  const [form, setForm] = useState<Investor>(
    investor || {
      id: uid(),
      name: '',
      firm: '',
      role: '',
      email: '',
      linkedin: '',
      checkSize: '',
      stage: 'Seed',
      sectors: [],
      location: '',
      introPath: '',
      notes: '',
      source: '',
      website: '',
      createdAt: new Date().toISOString(),
    }
  );

  const [sectorsInput, setSectorsInput] = useState(form.sectors.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      sectors: sectorsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const field = (label: string, key: keyof Investor, placeholder: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-0 outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200/60">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{investor ? 'Edit Investor' : 'Add Investor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field('Name', 'name', 'John Smith')}
            {field('Firm', 'firm', 'Sequoia Capital')}
          </div>
          {field('Role', 'role', 'Managing Partner')}
          <div className="grid grid-cols-2 gap-3">
            {field('Email', 'email', 'john@firm.com', 'email')}
            {field('LinkedIn', 'linkedin', 'linkedin.com/in/...')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Check Size', 'checkSize', '$500K - $2M')}
            {field('Stage', 'stage', 'Seed')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sectors (comma-separated)</label>
            <input
              value={sectorsInput}
              onChange={(e) => setSectorsInput(e.target.value)}
              placeholder="Consumer, AI, SaaS"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-0 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Location', 'location', 'San Francisco, CA')}
            {field('Intro Path', 'introPath', 'Warm — via NFX Signal')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Meeting notes, preferences..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-0 outline-none resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {investor ? 'Save Changes' : 'Add Investor'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
