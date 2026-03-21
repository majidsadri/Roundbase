import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Get the authenticated user from the Supabase session.
 * Returns the user object or null if not authenticated.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication for an API route.
 * Returns the user ID or a 401 response.
 */
export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { userId: user.id };
}
