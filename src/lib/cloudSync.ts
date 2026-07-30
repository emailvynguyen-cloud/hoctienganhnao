// MS VY ENGLISH SUPABASE-FIRST REALTIME CLOUD ENGINE
// Single Source of Truth: Supabase PostgreSQL Database (qbzmamuahgmaruwcqfyl.supabase.co)

import { supabaseFetch, SUPABASE_URL, SUPABASE_KEY } from './supabaseEngine';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ms_vy_english_realtime_channel')
  : null;

type DataUpdateCallback = () => void;
const subscribers: Set<DataUpdateCallback> = new Set();

let isLocalPushing = false;
let lastSyncedTimestamp = '';

const FALLBACK_CLOUD_URL = 'https://jsonblob.com/api/jsonBlob/019fb25c-afce-73f1-a29f-f624cb1e9cd6';

export const CloudSyncEngine = {
  // Subscribe to real-time updates across devices & tabs
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

    // 2. Real-time Supabase Event Listener (Ultra-fast 1.5s Polling Loop)
    const intervalId = setInterval(async () => {
      if (!isLocalPushing) {
        await this.pullInitialCloudData();
      }
    }, 1500);

    return () => {
      subscribers.delete(callback);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      clearInterval(intervalId);
    };
  },

  // Push local datasets to Supabase Cloud Database (Single Source of Truth)
  async pushToCloud(allStorageData: Record<string, any>) {
    isLocalPushing = true;
    const nowIso = new Date().toISOString();
    lastSyncedTimestamp = nowIso;

    // 1. Notify other open tabs in current browser instantly
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage('SYNC_DATA');
      } catch (e) {}
    }

    // 2. Write DIRECTLY to Supabase PostgreSQL Database
    try {
      const supaRes = await supabaseFetch('/rest/v1/master_store', 'POST', {
        id: 'master',
        last_updated: nowIso,
        payload: allStorageData,
      }, {
        'Prefer': 'resolution=merge-duplicates',
      });

      if (!supaRes.ok) {
        // Backup push to fallback endpoint
        await fetch(FALLBACK_CLOUD_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            appName: 'MS VY ENGLISH ONLINE SUPABASE CLOUD DATABASE',
            lastUpdated: nowIso,
            payload: allStorageData,
          }),
        });
      }
    } catch (e) {
      console.warn('Supabase Direct Push notice:', e);
    } finally {
      setTimeout(() => {
        isLocalPushing = false;
      }, 400);
    }
  },

  // Pull initial cloud data from Supabase (Single Source of Truth)
  async pullInitialCloudData(): Promise<boolean> {
    try {
      // 1. Pull directly from Supabase Database
      const supaRes = await supabaseFetch<any[]>('/rest/v1/master_store?select=*&id=eq.master', 'GET');
      
      let cloudPayload: any = null;
      let cloudTimestamp: string = '';

      if (supaRes.ok && supaRes.data && supaRes.data.length > 0) {
        const record = supaRes.data[0];
        cloudPayload = record.payload;
        cloudTimestamp = record.last_updated || record.lastUpdated || '';
      } else {
        // Fallback fetch if Supabase table is waiting for SQL initialization
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
        if (cloudTimestamp && cloudTimestamp === lastSyncedTimestamp && isLocalPushing) {
          return false;
        }

        lastSyncedTimestamp = cloudTimestamp || new Date().toISOString();

        let hasNewChanges = false;
        Object.keys(cloudPayload).forEach((key) => {
          try {
            const cloudVal = cloudPayload[key];
            const localRaw = localStorage.getItem(key);
            const cloudRaw = JSON.stringify(cloudVal);

            if (localRaw !== cloudRaw) {
              localStorage.setItem(key, cloudRaw);
              hasNewChanges = true;
            }
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
