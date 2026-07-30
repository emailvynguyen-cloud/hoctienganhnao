// MS VY ENGLISH OFFICIAL SUPABASE REALTIME CLOUD ENGINE
// Single Source of Truth: Supabase PostgreSQL Database (qbzmamuahgmaruwcqfyl.supabase.co)

import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabaseEngine';
import { updateLiveMemoryStore } from './storage';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ms_vy_english_realtime_channel')
  : null;

type DataUpdateCallback = () => void;
const subscribers: Set<DataUpdateCallback> = new Set();

let lastSyncedTimestamp = '';
let realtimeChannel: any = null;

const FALLBACK_CLOUD_URL = 'https://jsonblob.com/api/jsonBlob/019fb25c-afce-73f1-a29f-f624cb1e9cd6';

export const CloudSyncEngine = {
  // Subscribe to real-time updates across devices via Official Supabase SDK Channel
  subscribeToCloudData(callback: DataUpdateCallback) {
    subscribers.add(callback);

    // 1. Cross-Tab Broadcast Channel (Same browser instance)
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data === 'SYNC_DATA') {
        callback();
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }

    // 2. Official Supabase Realtime Subscription Channel
    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('database-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
          },
          (payload: any) => {
            console.log('[SUPABASE REALTIME EVENT]', payload);
            const record = payload?.new || payload?.record;
            if (record && record.payload) {
              const cloudPayload = record.payload;
              Object.keys(cloudPayload).forEach((key) => {
                updateLiveMemoryStore(key, cloudPayload[key]);
              });
              subscribers.forEach((cb) => cb());
            } else {
              this.pullInitialCloudData();
            }
          }
        )
        .subscribe((status: string) => {
          console.log('[SUPABASE REALTIME SUBSCRIPTION STATUS]:', status);
        });
    }

    return () => {
      subscribers.delete(callback);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      if (subscribers.size === 0 && realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  },

  // Push local datasets to Supabase Cloud Database (Single Source of Truth)
  async pushToCloud(allStorageData: Record<string, any>) {
    const nowIso = new Date().toISOString();
    lastSyncedTimestamp = nowIso;

    // Update in-memory store immediately
    Object.keys(allStorageData).forEach((key) => {
      updateLiveMemoryStore(key, allStorageData[key]);
    });

    // 1. Notify other open tabs in current browser instantly
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage('SYNC_DATA');
      } catch (e) {}
    }

    // 2. Write DIRECTLY to Supabase PostgreSQL Database over Official Supabase SDK / REST API
    console.log("Saving to Supabase...", { timestamp: nowIso, entityKeys: Object.keys(allStorageData) });

    try {
      const result = await supabase
        .from('master_store')
        .upsert(
          {
            id: 'master',
            last_updated: nowIso,
            payload: allStorageData,
          },
          { onConflict: 'id' }
        );

      console.log("Supabase save result:", result);

      if (result.error) {
        console.error("Supabase SDK upsert failed:", {
          status: result.status || result.error.code,
          error: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
        });

        // Fallback REST endpoint upsert
        console.log("Attempting Supabase REST fetch fallback...");
        const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_store`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            id: 'master',
            last_updated: nowIso,
            payload: allStorageData,
          }),
        });

        const responseText = await restResponse.text();
        console.log("Supabase REST fallback response:", {
          status: restResponse.status,
          statusText: restResponse.statusText,
          body: responseText,
        });
      }
    } catch (e: any) {
      console.error("Supabase Direct Push exception:", {
        message: e?.message || e,
        stack: e?.stack,
      });
    }
  },

  // Pull initial cloud data from Supabase (Single Source of Truth)
  async pullInitialCloudData(): Promise<boolean> {
    try {
      // 1. Pull directly from Supabase Database using official SDK
      const { data, error } = await supabase
        .from('master_store')
        .select('*')
        .eq('id', 'master');

      let cloudPayload: any = null;
      let cloudTimestamp: string = '';

      if (!error && data && data.length > 0) {
        const record = data[0];
        cloudPayload = record.payload;
        cloudTimestamp = record.last_updated || record.lastUpdated || '';
      } else {
        // Fallback fetch if PostgREST table is initializing
        const fbRes = await fetch(`${FALLBACK_CLOUD_URL}?_t=${Date.now()}`, {
          headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          cloudPayload = fbData.payload;
          cloudTimestamp = fbData.lastUpdated || '';
        }
      }

      if (cloudPayload) {
        lastSyncedTimestamp = cloudTimestamp || new Date().toISOString();

        let hasNewChanges = false;
        Object.keys(cloudPayload).forEach((key) => {
          try {
            const cloudVal = cloudPayload[key];
            updateLiveMemoryStore(key, cloudVal);
            hasNewChanges = true;
          } catch (e) {}
        });

        if (hasNewChanges) {
          subscribers.forEach((cb) => cb());
        }

        return true;
      }
    } catch (e) {
      console.warn('Supabase Cloud Data pull notice:', e);
    }
    return false;
  },
};
