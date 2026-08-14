// MS VY ENGLISH OFFICIAL SUPABASE REALTIME CLOUD ENGINE
// Single Source of Truth: Supabase PostgreSQL Database (qbzmamuahgmaruwcqfyl.supabase.co)

import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabaseEngine';
import { updateLiveMemoryStore } from './storage';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ms_vy_english_realtime_channel')
  : null;

type DataUpdateCallback = (payload?: any) => void;
const subscribers: Set<DataUpdateCallback> = new Set();

let lastSyncedTimestamp = '';
let realtimeChannel: any = null;

export const CloudSyncEngine = {
  // Subscribe to real-time updates across devices via Official Supabase SDK Channel
  subscribeToCloudData(callback: DataUpdateCallback) {
    subscribers.add(callback);

    // 1. Cross-Tab Broadcast Channel (Same browser instance UI optimization)
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
      console.log('[SYNC] Realtime subscribed');
      realtimeChannel = supabase
        .channel('database-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
          },
          async (payload: any) => {
            console.log('[SYNC] Realtime event received', payload);

            // 1. Write payload directly if inline in payload.new.payload
            const cloudPayload = payload?.new?.payload || payload?.record?.payload;
            if (cloudPayload) {
              Object.keys(cloudPayload).forEach((key) => {
                updateLiveMemoryStore(key, cloudPayload[key]);
              });
              subscribers.forEach((cb) => cb(cloudPayload));
              console.log('[SYNC] Pending tasks recalculated from inline payload');
            }

            // 2. Always pull latest payload from Supabase DB to guarantee 100% fresh data sync
            await this.pullInitialCloudData();
            console.log('[SYNC] Pending tasks recalculated from cloud pull');
          }
        )
        .subscribe((status: string) => {
          console.log('[SUPABASE REALTIME SUBSCRIPTION STATUS]:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[SYNC] Realtime reconnect detected -> Triggering full resync');
            this.pullInitialCloudData();
          }
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

      if (result.error) {
        console.error('[SYNC WARNING] Supabase Upsert error:', result.error);
        // Fallback REST endpoint upsert
        await fetch(`${SUPABASE_URL}/rest/v1/master_store`, {
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
      } else {
        console.log('[SYNC] Push to Supabase successful');
      }
    } catch (e: any) {
      console.error('[SYNC ERROR] Supabase Direct Push exception:', e);
    }
  },

  // Pull initial cloud data from Supabase (Single Source of Truth)
  async pullInitialCloudData(): Promise<boolean> {
    console.log('[SYNC] Initial cloud fetch started');
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
        // Direct REST fetch fallback if PostgREST cache is updating
        const restRes = await fetch(`${SUPABASE_URL}/rest/v1/master_store?id=eq.master`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });
        if (restRes.ok) {
          const restData = await restRes.json();
          if (restData && restData.length > 0) {
            cloudPayload = restData[0].payload;
            cloudTimestamp = restData[0].last_updated || '';
          }
        }
      }

      if (cloudPayload) {
        lastSyncedTimestamp = cloudTimestamp || new Date().toISOString();

        Object.keys(cloudPayload).forEach((key) => {
          try {
            const cloudVal = cloudPayload[key];
            updateLiveMemoryStore(key, cloudVal);
          } catch (e) {}
        });

        subscribers.forEach((cb) => cb(cloudPayload));
        console.log('[SYNC] Initial cloud fetch completed');
        return true;
      }
    } catch (e) {
      console.warn('[SYNC WARNING] Supabase Cloud Data pull notice:', e);
    }
    return false;
  },
};
