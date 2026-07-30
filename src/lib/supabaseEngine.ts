// SUPABASE REALTIME CLOUD DATABASE ENGINE FOR MS. VY ENGLISH
// Supabase Project URL: https://qbzmamuahgmaruwcqfyl.supabase.co

export const SUPABASE_URL = 'https://qbzmamuahgmaruwcqfyl.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_dSq3EI8zzjEqA4BfOqNl6A_nsd-QTnB';

export async function supabaseFetch<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body: any = null,
  customHeaders: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}${endpoint}`;
    
    // Add cache-busting query parameter for GET requests
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
