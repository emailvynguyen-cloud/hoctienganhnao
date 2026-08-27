// MS VY ENGLISH OFFICIAL SUPABASE REALTIME CLOUD ENGINE
// Single Source of Truth: Supabase PostgreSQL Database (qbzmamuahgmaruwcqfyl.supabase.co)

import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabaseEngine';
import { updateLiveMemoryStore, getLiveMemoryStore } from './storage';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ms_vy_english_realtime_channel')
  : null;

type DataUpdateCallback = (payload?: any) => void;
const subscribers: Set<DataUpdateCallback> = new Set();

let lastSyncedTimestamp = '';
let realtimeChannel: any = null;
let reconnectTimer: any = null;

/**
 * INTELLIGENT DEEP STORE MERGING ALGORITHM
 * Merges local store and incoming cloud store deterministically:
 * - Primitive ID arrays (dismissed tasks, waived penalties) => Set union
 * - Object collection arrays (sessions, classes, students, fines) => Merge by ID/UID with timestamp comparison
 */
export function mergeStorePayload(
  localData: Record<string, any>,
  cloudData: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...localData };

  Object.keys(cloudData).forEach((key) => {
    const localVal = localData[key];
    const cloudVal = cloudData[key];

    if (!localVal) {
      merged[key] = cloudVal;
      return;
    }

    if (!cloudVal) {
      return;
    }

    // 1. Primitive string array keys (dismissed tasks, waived penalties, badges)
    if (
      key === 'vy_dismissed_pending_tasks_v4' ||
      key === 'vy_waived_penalties_v4' ||
      (Array.isArray(localVal) && Array.isArray(cloudVal) && localVal.length > 0 && typeof localVal[0] === 'string')
    ) {
      merged[key] = Array.from(new Set([...(localVal || []), ...(cloudVal || [])]));
      return;
    }

    // 2. Object collection array keys with id / uid (sessions, students, classes, homework, fines)
    if (Array.isArray(localVal) && Array.isArray(cloudVal)) {
      const itemMap = new Map<string, any>();

      // Insert cloud items first
      cloudVal.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const itemId = item.id || item.uid;
          if (itemId) itemMap.set(String(itemId), item);
        }
      });

      // Merge local items
      localVal.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const itemId = item.id || item.uid;
          if (itemId) {
            const existing = itemMap.get(String(itemId));
            if (!existing) {
              itemMap.set(String(itemId), item);
            } else {
              const localTs = item.updatedAt || item.createdAt || item.date || '';
              const cloudTs = existing.updatedAt || existing.createdAt || existing.date || '';
              let mergedItem = { ...existing, ...item };
              if (cloudTs && localTs && cloudTs > localTs) {
                mergedItem = { ...item, ...existing };
              }
              if (existing.password || item.password) {
                mergedItem.password = item.password || existing.password || 'admin123';
              }
              if (existing.email || item.email) {
                mergedItem.email = item.email || existing.email;
              }
              itemMap.set(String(itemId), mergedItem);
            }
          }
        }
      });

      merged[key] = Array.from(itemMap.values());
      return;
    }

    // Default: cloud value
    merged[key] = cloudVal;
  });

  return merged;
}

export const CloudSyncEngine = {
  // Ensure subscription to Supabase Realtime channel for master_store table
  ensureRealtimeSubscription() {
    if (realtimeChannel) return;

    console.log('[SYNC][REALTIME] Subscribing to Supabase Realtime channel for master_store table...');
    realtimeChannel = supabase
      .channel('master_store_realtime_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'master_store',
        },
        async (payload: any) => {
          console.log('[SYNC][REALTIME] Realtime event received from Supabase DB:', payload.eventType, payload);

          // 1. Process inline payload if available
          const cloudPayload = payload?.new?.payload || payload?.record?.payload;
          if (cloudPayload) {
            console.log('[SYNC][MERGE] Merging inline realtime payload into local store...');
            const currentLocal = getLiveMemoryStore();
            const merged = mergeStorePayload(currentLocal, cloudPayload);
            Object.keys(merged).forEach((key) => {
              updateLiveMemoryStore(key, merged[key]);
            });
            subscribers.forEach((cb) => cb(merged));
            console.log('[SYNC][STATE] Notified subscribers from inline realtime payload');
          }

          // 2. Perform background pull from Supabase DB to guarantee complete sync
          await this.pullInitialCloudData();
        }
      )
      .subscribe((status: string, err?: any) => {
        console.log(`[SYNC][REALTIME] Subscription status: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('[SYNC][REALTIME] Channel status: SUBSCRIBED -> Pulling initial cloud state');
          this.pullInitialCloudData();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[SYNC][REALTIME] Channel status error: ${status}. Scheduling re-subscription...`);
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              if (realtimeChannel) {
                try { supabase.removeChannel(realtimeChannel); } catch (e) {}
                realtimeChannel = null;
              }
              this.ensureRealtimeSubscription();
            }, 3000);
          }
        }
      });
  },

  // Subscribe to real-time updates across devices via Official Supabase SDK Channel
  subscribeToCloudData(callback: DataUpdateCallback) {
    subscribers.add(callback);

    // 1. Cross-Tab Broadcast Channel (Same browser instance UI optimization)
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data === 'SYNC_DATA') {
        console.log('[SYNC][BROADCAST] Message received on BroadcastChannel -> trigger callback');
        callback();
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }

    // 2. Official Supabase Realtime Subscription Channel
    this.ensureRealtimeSubscription();

    return () => {
      subscribers.delete(callback);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      if (subscribers.size === 0 && realtimeChannel) {
        console.log('[SYNC][REALTIME] Removing Supabase channel subscription (no active subscribers)');
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  },

  // Push local datasets to Supabase Cloud Database (Single Source of Truth)
  async pushToCloud(allStorageData: Record<string, any>) {
    const nowIso = new Date().toISOString();
    lastSyncedTimestamp = nowIso;
    console.log('[SYNC][WRITE] pushToCloud initiated with payload keys:', Object.keys(allStorageData));

    // Update in-memory store immediately
    Object.keys(allStorageData).forEach((key) => {
      updateLiveMemoryStore(key, allStorageData[key]);
    });

    // 1. Notify other open tabs in current browser instantly via BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage('SYNC_DATA');
        console.log('[SYNC][BROADCAST] Posted SYNC_DATA event to BroadcastChannel');
      } catch (e) {}
    }

    // 2. Write DIRECTLY to Supabase PostgreSQL Database over Official Supabase SDK / REST API
    try {
      console.log('[SYNC][SUPABASE] Upserting master_store record to Supabase...');
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
        const res = await fetch(`${SUPABASE_URL}/rest/v1/master_store`, {
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
        if (res.ok) {
          console.log('[SYNC][SUPABASE] REST fallback upsert successful');
        } else {
          console.error('[SYNC ERROR] REST fallback upsert failed:', await res.text());
        }
      } else {
        console.log('[SYNC][SUPABASE] SDK Upsert successful');
      }
    } catch (e: any) {
      console.error('[SYNC ERROR] Supabase Direct Push exception:', e);
    }
  },

  // Pull initial cloud data from Supabase (Single Source of Truth)
  async pullInitialCloudData(): Promise<boolean> {
    console.log('[SYNC][SUPABASE] Fetching master_store record from Supabase DB...');
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
        const currentLocal = getLiveMemoryStore();

        console.log('[SYNC][MERGE] Merging fetched cloud payload with local memory store...');
        const mergedPayload = mergeStorePayload(currentLocal, cloudPayload);

        Object.keys(mergedPayload).forEach((key) => {
          try {
            updateLiveMemoryStore(key, mergedPayload[key]);
          } catch (e) {}
        });

        subscribers.forEach((cb) => cb(mergedPayload));
        console.log('[SYNC][STATE] Notified React subscribers after cloud fetch merge');
        return true;
      }
    } catch (e) {
      console.warn('[SYNC WARNING] Supabase Cloud Data pull notice:', e);
    }
    return false;
  },
};
