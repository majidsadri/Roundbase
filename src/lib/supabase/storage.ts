import { createClient } from '@supabase/supabase-js';

const BUCKET = 'RoundBase';

// Direct Supabase client for storage operations (not SSR cookie-based)
// Uses the anon key — relies on bucket being public + RLS policy for authenticated users
let _client: ReturnType<typeof createClient> | null = null;

function getStorageClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

export async function uploadToStorage(
  storagePath: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = getStorageClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, data, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return { publicUrl: urlData.publicUrl };
}

export async function deleteFromStorage(storagePath: string): Promise<void> {
  const supabase = getStorageClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export function getPublicUrl(storagePath: string): string {
  // Handle old local paths
  if (storagePath.startsWith('/uploads/')) return storagePath;
  const supabase = getStorageClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
