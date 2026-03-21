'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/app');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) return null;

  return <LandingPage />;
}
