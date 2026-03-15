'use client';

import { Rocket, Users, Kanban, FolderOpen, BarChart3, Globe } from 'lucide-react';

type Page = 'dashboard' | 'investors' | 'pipeline' | 'discover' | 'projects';

export default function Sidebar({
  active,
  onChange,
}: {
  active: Page;
  onChange: (p: Page) => void;
}) {
  const items: { key: Page; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { key: 'discover', label: 'Discover', icon: <Globe size={18} /> },
    { key: 'investors', label: 'Investors', icon: <Users size={18} /> },
    { key: 'pipeline', label: 'Pipeline', icon: <Kanban size={18} /> },
    { key: 'projects', label: 'Projects', icon: <FolderOpen size={18} /> },
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Rocket className="text-white" size={15} />
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">Roundbase</span>
            <p className="text-[10px] text-gray-400 -mt-0.5 tracking-wide">FUNDRAISE PIPELINE</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all mb-0.5 ${
              active === item.key
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-300">Roundbase v0.1</p>
      </div>
    </aside>
  );
}
