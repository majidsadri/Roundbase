'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { LogoMark } from '@/components/Logo';
import DashboardPage from '@/components/DashboardPage';
import InvestorsPage from '@/components/InvestorsPage';
import PipelinePage from '@/components/PipelinePage';
import DiscoverPage from '@/components/DiscoverPage';
import ProjectsPage from '@/components/ProjectsPage';
import { createClient } from '@/lib/supabase/client';

type Page = 'dashboard' | 'investors' | 'pipeline' | 'discover' | 'projects';

const TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  investors: 'Investors',
  pipeline: 'Pipeline',
  discover: 'Discover Investors',
  projects: 'Projects',
};

const SUBTITLES: Record<Page, string> = {
  dashboard: 'Overview of your fundraising activity',
  investors: 'Manage your investor database',
  pipeline: 'Track investor conversations',
  discover: 'Find and import new investors',
  projects: 'Manage your fundraising projects',
};

export default function AppPage() {
  const [page, setPage] = useState<Page>('dashboard');
  const [navKey, setNavKey] = useState(0);
  const router = useRouter();

  const handleNav = useCallback((p: Page) => {
    setPage(p);
    // Always bump key so re-clicking the same tab resets sub-views
    setNavKey(k => k + 1);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar active={page} onChange={handleNav} onLogoClick={() => router.push('/')} onSignOut={handleSignOut} />
      <main className="flex-1 px-4 py-4 pb-24 md:pb-7 md:px-8 md:py-7 overflow-x-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2.5 mb-4">
          <div style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
            <LogoMark size={28} />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {TITLES[page]}
            </h1>
            <p className="text-[10px] text-gray-400 font-medium" style={{ letterSpacing: '0.03em' }}>ROUNDBASE</p>
          </div>
        </div>

        {/* Desktop header */}
        <div className="mb-4 md:mb-6 hidden md:block">
          <h1 className="text-xl font-bold text-gray-800" style={{ letterSpacing: '-0.025em' }}>
            {TITLES[page]}
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{SUBTITLES[page]}</p>
        </div>

        <div className="page-enter" key={navKey}>
          {page === 'dashboard' && <DashboardPage onNavigate={handleNav} />}
          {page === 'investors' && <InvestorsPage />}
          {page === 'pipeline' && <PipelinePage />}
          {page === 'discover' && <DiscoverPage />}
          {page === 'projects' && <ProjectsPage />}
        </div>
      </main>
    </div>
  );
}
