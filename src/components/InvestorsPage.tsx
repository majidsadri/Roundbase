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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
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

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} investor${selected.size > 1 ? 's' : ''}?`)) return;
    setDeleting(true);
    const ids = Array.from(selected);
    for (let i = 0; i < ids.length; i++) {
      await deleteInvestor(ids[i]);
    }
    setSelected(new Set());
    setDeleting(false);
    reload();
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

  const allFilteredSelected = filtered.length > 0 && filtered.every((inv) => selected.has(inv.id));
  const someSelected = selected.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((inv) => inv.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search investors..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          />
        </div>

        {someSelected ? (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting...' : `Delete ${selected.size} selected`}
          </button>
        ) : (
          <>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-white"
            >
              <Upload size={14} />
              Import
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              <Plus size={14} />
              Add Investor
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 cursor-pointer accent-gray-900"
                />
              </th>
              {([
                ['name', 'Name'],
                ['firm', 'Firm'],
                ['checkSize', 'Check Size'],
                ['location', 'Location'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Sectors</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Intro</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {investors.length === 0
                    ? 'No investors yet. Add one or import a CSV.'
                    : 'No matching investors.'}
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className={`cursor-pointer ${selected.has(inv.id) ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                  onClick={() => setDrawerInvestor(inv)}
                >
                  <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 cursor-pointer accent-gray-900"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.name}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.firm}</td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">{inv.checkSize}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inv.sectors.slice(0, 3).map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{inv.introPath}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawerInvestor(inv);
                        }}
                        title="Reach out"
                        className="p-1.5 text-gray-300 hover:text-gray-600 rounded"
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(inv);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-gray-300 hover:text-gray-600 rounded"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(inv.id);
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-500 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2 tabular-nums">{filtered.length} investors</p>

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
