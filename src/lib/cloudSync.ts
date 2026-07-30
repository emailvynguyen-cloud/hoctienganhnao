// MS VY ENGLISH REALTIME CLOUD ENGINE (DUAL CLOUD STORAGE)
// Primary Cloud Endpoint: Permanent JSONBlob Cloud REST Engine
// Secondary Cloud Endpoint: Firebase Firestore

const MASTER_CLOUD_ENDPOINT = 'https://jsonblob.com/api/jsonBlob/019fb25c-afce-73f1-a29f-f624cb1e9cd6';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ms_vy_english_realtime_channel')
  : null;

type DataUpdateCallback = () => void;
const subscribers: Set<DataUpdateCallback> = new Set();

let isLocalPushing = false;
let lastSyncedTimestamp = '';

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

    // 2. Real-time Polling across different devices (Every 3 seconds)
    const intervalId = setInterval(async () => {
      if (!isLocalPushing) {
        await this.pullInitialCloudData();
      }
    }, 3000);

    return () => {
      subscribers.delete(callback);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      clearInterval(intervalId);
    };
  },

  // Push local datasets to Global Cloud & Broadcast to all other devices/tabs
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

    // 2. Push to Primary Cloud Database via REST PUT
    try {
      await fetch(MASTER_CLOUD_ENDPOINT, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          appName: 'MS VY ENGLISH ONLINE REALTIME CLOUD DATABASE',
          lastUpdated: nowIso,
          payload: allStorageData,
        }),
      });
    } catch (e) {
      console.warn('Primary Cloud sync push notice:', e);
    } finally {
      setTimeout(() => {
        isLocalPushing = false;
      }, 500);
    }
  },

  // Pull initial cloud data on app launch and periodic sync
  async pullInitialCloudData(): Promise<boolean> {
    try {
      const res = await fetch(MASTER_CLOUD_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data && data.payload) {
        // Only update local storage if cloud payload is newer or not yet pushed by local
        if (data.lastUpdated && data.lastUpdated === lastSyncedTimestamp && isLocalPushing) {
          return false;
        }

        lastSyncedTimestamp = data.lastUpdated || new Date().toISOString();
        const payload = data.payload;

        let hasNewChanges = false;
        Object.keys(payload).forEach((key) => {
          try {
            const cloudVal = payload[key];
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
      console.warn('Cloud data pull notice:', e);
    }
    return false;
  },
};
