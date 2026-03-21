'use client';

import { Users, Kanban, FolderOpen, BarChart3, Globe, LogOut } from 'lucide-react';
import { LogoMark, LogoFull } from './Logo';

type Page = 'dashboard' | 'investors' | 'pipeline' | 'discover' | 'projects';

export default function Sidebar({
  active,
  onChange,
  onLogoClick,
  onSignOut,
}: {
  active: Page;
  onChange: (p: Page) => void;
  onLogoClick?: () => void;
  onSignOut?: () => void;
}) {
  const items: { key: Page; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: <BarChart3 size={18} /> },
    { key: 'projects', label: 'Projects', mobileLabel: 'Projects', icon: <FolderOpen size={18} /> },
    { key: 'discover', label: 'Discover', mobileLabel: 'Discover', icon: <Globe size={18} /> },
    { key: 'investors', label: 'Investors', mobileLabel: 'Investors', icon: <Users size={18} /> },
    { key: 'pipeline', label: 'Pipeline', mobileLabel: 'Pipeline', icon: <Kanban size={18} /> },
  ];

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200/40 pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: 'var(--shadow-bottom-bar)' }}
      >
        <div className="flex items-stretch justify-around">
          {items.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 relative ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
                )}
                <span className={isActive ? 'scale-110 transition-transform' : 'transition-transform'}>
                  {item.icon}
                </span>
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-gray-400"
            >
              <LogOut size={18} />
              <span className="text-[10px] font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-44 bg-white min-h-screen flex-col relative border-r border-gray-100"
        style={{ position: 'sticky', top: 0, height: '100vh' }}
      >
        <div className="px-4 pt-5 pb-4">
          <button onClick={onLogoClick} className="hover:opacity-70 transition-opacity" title="Back to home">
            <LogoFull iconSize={28} />
          </button>
        </div>

        <div className="px-3">
          <div className="h-px bg-gray-100 mb-2" />
        </div>

        <nav className="px-2.5">
          {items.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={`w-full flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[13px] mb-px transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <span className={isActive ? 'text-white/90' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sign out — pinned to bottom */}
        {onSignOut && (
          <div className="px-2.5 pb-4 mt-auto">
            <div className="h-px bg-gray-100 mb-2" />
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[13px] text-gray-400 hover:text-red-600 hover:bg-red-50/50 transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
