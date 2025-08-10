// supabase.js
// This is a minimal stub for later Supabase integration.
// When ready, replace the placeholders with your Supabase URL & KEY and
// implement functions such as saveGameConfig(), fetchGameList(), uploadAsset().

export const SUPABASE = {
  url: 'https://YOUR-PROJECT.supabase.co',
  key: 'PUBLIC-ANON-KEY',
};

export async function saveGameConfigToSupabase(meta) {
  // meta: { title, slug, configJson, assetsUrl, published }
  // Implementation placeholder:
  console.warn('saveGameConfigToSupabase called but not implemented', meta);
  throw new Error('Supabase not configured yet.');
}

