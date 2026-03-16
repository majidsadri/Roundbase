'use client';

import { Users, Kanban, FolderOpen, BarChart3, Globe } from 'lucide-react';

type Page = 'dashboard' | 'investors' | 'pipeline' | 'discover' | 'projects';

export default function Sidebar({
  active,
  onChange,
}: {
  active: Page;
  onChange: (p: Page) => void;
}) {
  const items: { key: Page; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={17} /> },
    { key: 'discover', label: 'Discover', icon: <Globe size={17} /> },
    { key: 'investors', label: 'Investors', icon: <Users size={17} /> },
    { key: 'pipeline', label: 'Pipeline', icon: <Kanban size={17} /> },
    { key: 'projects', label: 'Projects', icon: <FolderOpen size={17} /> },
  ];

  return (
    <aside className="w-52 bg-white border-r border-gray-200/60 min-h-screen flex flex-col">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-[15px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>R</span>
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-gray-900">Roundbase</span>
        </div>
      </div>
      <nav className="flex-1 px-3 pt-1 pb-4">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] mb-0.5 ${
              active === item.key
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-300 font-medium">v0.1</p>
      </div>
    </aside>
  );
}
