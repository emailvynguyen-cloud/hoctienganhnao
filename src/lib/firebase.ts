import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

// Default Free Public Firebase Config for MS. VY ENGLISH Real-time Cloud Sync
const firebaseConfig = {
  apiKey: "AIzaSyD-MSVYENGLISH_DEFAULT_KEY_001",
  authDomain: "ms-vy-english.firebaseapp.com",
  projectId: "ms-vy-english",
  storageBucket: "ms-vy-english.appspot.com",
  messagingSenderId: "98765432101",
  appId: "1:98765432101:web:abcdef123456789"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export const CloudStorage = {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
};
