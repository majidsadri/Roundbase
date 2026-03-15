'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardPage from '@/components/DashboardPage';
import InvestorsPage from '@/components/InvestorsPage';
import PipelinePage from '@/components/PipelinePage';
import DiscoverPage from '@/components/DiscoverPage';
import ProjectsPage from '@/components/ProjectsPage';

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

export default function Home() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={page} onChange={setPage} />
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{TITLES[page]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{SUBTITLES[page]}</p>
        </div>
        {page === 'dashboard' && <DashboardPage />}
        {page === 'investors' && <InvestorsPage />}
        {page === 'pipeline' && <PipelinePage />}
        {page === 'discover' && <DiscoverPage />}
        {page === 'projects' && <ProjectsPage />}
      </main>
    </div>
  );
}
