'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Upload, Trash2, Edit2, ChevronUp, ChevronDown, Send } from 'lucide-react';
import { Investor } from '@/types';
import { getInvestors, saveInvestor, deleteInvestor, importInvestorsCSV } from '@/lib/store';
import InvestorModal from './InvestorModal';
import InvestorDrawer from './InvestorDrawer';

type SortKey = 'name' | 'firm' | 'checkSize' | 'location' | 'createdAt';

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);
  const [drawerInvestor, setDrawerInvestor] = useState<Investor | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    getInvestors().then(setInvestors);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleSave = async (inv: Investor) => {
    await saveInvestor(inv);
    reload();
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this investor?')) {
      await deleteInvestor(id);
      reload();
    }
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const count = await importInvestorsCSV(reader.result as string);
      alert(`Imported ${count} investors`);
      reload();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = investors
    .filter((i) => {
      const q = search.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.firm.toLowerCase().includes(q) ||
        i.sectors.some((s) => s.toLowerCase().includes(q)) ||
        i.location.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey] || '';
      const bv = b[sortKey] || '';
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search investors..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <Upload size={16} />
          Import CSV
        </button>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Investor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {([
                ['name', 'Name'],
                ['firm', 'Firm'],
                ['checkSize', 'Check Size'],
                ['location', 'Location'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sectors</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Intro</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  {investors.length === 0
                    ? 'No investors yet. Add one or import a CSV.'
                    : 'No matching investors.'}
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setDrawerInvestor(inv)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.name}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.firm}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.checkSize}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inv.sectors.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{inv.introPath}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawerInvestor(inv);
                        }}
                        title="Reach out"
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                      >
                        <Send size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(inv);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(inv.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">{filtered.length} investors</p>

      {modalOpen && (
        <InvestorModal
          investor={editing}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      )}

      {drawerInvestor && (
        <InvestorDrawer
          investor={drawerInvestor}
          onClose={() => setDrawerInvestor(null)}
          onUpdate={() => reload()}
        />
      )}
    </div>
  );
}
