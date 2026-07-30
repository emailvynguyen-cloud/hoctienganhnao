import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';

// Environment variable or Fallback Public Cloud Config for Ms. Vy English
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC_MSVYENGLISH_DEFAULT_KEY_2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ms-vy-english-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ms-vy-english-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ms-vy-english-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "847291038592",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:847291038592:web:98a7b6c5d4e3f210"
};

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Firestore document path for central storage
const DATA_DOC_REF = doc(db, 'ms_vy_english_database', 'master_store');

// BroadcastChannel for instant same-browser cross-tab sync
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ms_vy_english_realtime_channel')
  : null;

type DataUpdateCallback = () => void;
const subscribers: Set<DataUpdateCallback> = new Set();

let isLocalPushing = false;

export const CloudSyncEngine = {
  // Subscribe to real-time updates across devices & tabs
  subscribeToCloudData(callback: DataUpdateCallback) {
    subscribers.add(callback);

    // 1. Listen to Cross-Tab Broadcast Channel
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data === 'SYNC_DATA') {
        callback();
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }

    // 2. Listen to Firestore Realtime Snapshot across different devices
    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        DATA_DOC_REF,
        (snapshot) => {
          if (snapshot.exists() && !isLocalPushing) {
            const data = snapshot.data();
            if (data && data.payload) {
              const payload = data.payload;
              // Write received cloud payload into local storage keys
              Object.keys(payload).forEach((key) => {
                try {
                  localStorage.setItem(key, JSON.stringify(payload[key]));
                } catch (e) {
                  console.warn(`Error writing cloud key ${key}:`, e);
                }
              });
              // Notify UI components to reload state
              subscribers.forEach((cb) => cb());
            }
          }
        },
        (error) => {
          console.warn('Real-time cloud listener notice:', error.message);
        }
      );
    } catch (e) {
      console.warn('Firestore snapshot listener setup notice:', e);
    }

    return () => {
      subscribers.delete(callback);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      unsubscribeFirestore();
    };
  },

  // Push local datasets to Cloud & Broadcast to other tabs/devices
  async pushToCloud(allStorageData: Record<string, any>) {
    isLocalPushing = true;

    // 1. Notify other open tabs in current browser instantly
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage('SYNC_DATA');
      } catch (e) {}
    }

    // 2. Push to Firestore Cloud Database for cross-device real-time sync
    try {
      await setDoc(DATA_DOC_REF, {
        payload: allStorageData,
        lastUpdated: new Date().toISOString(),
        updatedByDevice: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      }, { merge: true });
    } catch (e) {
      console.warn('Cloud sync push notice (falling back to local cache):', e);
    } finally {
      setTimeout(() => {
        isLocalPushing = false;
      }, 800);
    }
  },

  // Pull initial cloud data on first app launch
  async pullInitialCloudData() {
    try {
      const snapshot = await getDoc(DATA_DOC_REF);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.payload) {
          const payload = data.payload;
          Object.keys(payload).forEach((key) => {
            try {
              localStorage.setItem(key, JSON.stringify(payload[key]));
            } catch (e) {}
          });
          return true;
        }
      }
    } catch (e) {
      console.warn('Initial cloud pull notice:', e);
    }
    return false;
  }
};
