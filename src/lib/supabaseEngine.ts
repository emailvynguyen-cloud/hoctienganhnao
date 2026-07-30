// OFFICIAL SUPABASE JS CLIENT ENGINE FOR MS. VY ENGLISH
// Supabase Project URL: https://qbzmamuahgmaruwcqfyl.supabase.co

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://qbzmamuahgmaruwcqfyl.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_dSq3EI8zzjEqA4BfOqNl6A_nsd-QTnB';

// Safe initialization of official Supabase Client
let rawSupabaseClient: any = null;
try {
  rawSupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} catch (e) {
  console.warn('Supabase SDK initialization warning:', e);
}

export const supabase = rawSupabaseClient || {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => ({}),
    }),
  }),
  removeChannel: () => {},
};

export async function supabaseFetch<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body: any = null,
  customHeaders: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}${endpoint}`;
    const fetchUrl = method === 'GET' 
      ? (fullUrl.includes('?') ? `${fullUrl}&_t=${Date.now()}` : `${fullUrl}?_t=${Date.now()}`)
      : fullUrl;

    const headers: Record<string, string> = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...customHeaders,
    };

    const options: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(fetchUrl, options);
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, status: res.status, data: null, error: errText };
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.warn('Supabase fetch error:', err?.message || err);
    return { ok: false, status: 0, data: null, error: err?.message || 'Network error' };
  }
}
