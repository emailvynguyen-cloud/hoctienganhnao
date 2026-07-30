// SUPABASE REALTIME CLIENT ENGINE FOR MS. VY ENGLISH
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

// REALTIME WEBSOCKET SUBSCRIPTION CHANNEL WITH AUTO-RECONNECT
export class SupabaseRealtimeChannel {
  private ws: WebSocket | null = null;
  private channelName: string;
  private onDataChangeCallback: (payload: any) => void;
  private isClosedManually = false;
  private reconnectTimer: any = null;

  constructor(channelName: string, onDataChangeCallback: (payload: any) => void) {
    this.channelName = channelName;
    this.onDataChangeCallback = onDataChangeCallback;
    this.connect();
  }

  private connect() {
    if (this.isClosedManually) return;
    const wsUrl = `wss://qbzmamuahgmaruwcqfyl.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Join topic for postgres_changes on schema 'public' (matches supabase.channel(...).on('postgres_changes', ...))
        const joinMsg = {
          topic: `realtime:${this.channelName}`,
          event: 'phx_join',
          payload: {
            config: {
              postgres_changes: [
                { event: '*', schema: 'public' }
              ]
            }
          },
          ref: Date.now().toString()
        };
        this.ws?.send(JSON.stringify(joinMsg));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && (data.event === 'postgres_changes' || data.event === 'INSERT' || data.event === 'UPDATE' || data.event === 'DELETE' || (data.payload && data.payload.data))) {
            const changePayload = data.payload?.data || data.payload;
            this.onDataChangeCallback(changePayload);
          }
        } catch (e) {}
      };

      this.ws.onerror = () => {
        this.scheduleReconnect();
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isClosedManually || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  public unsubscribe() {
    this.isClosedManually = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }
  }
}
