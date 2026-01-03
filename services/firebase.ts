
// @google/genai Coding Guidelines: This file handles Firebase integration.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { Transaction, Account, Category } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCtjGB-Ssh1Tqug2H3JODo9fZbkDUpK_8s",
  authDomain: "zenith-ledger-f6ce7.firebaseapp.com",
  projectId: "zenith-ledger-f6ce7",
  storageBucket: "zenith-ledger-f6ce7.firebasestorage.app",
  messagingSenderId: "161082426870",
  appId: "1:161082426870:web:45d7b7d8285b8e0d39b3d7",
  measurementId: "G-DFQY4Z2NKN"
};

// Initialize Firebase with modular SDK v9+
// Fix: Ensure modular initialization and exports are clean
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// AUTH HELPERS
export const loginUser = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerUser = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logoutUser = () => signOut(auth);

// Re-exports for consumers
// Fix: Re-exporting onAuthStateChanged and User type cleanly
export { onAuthStateChanged };
export type { User };

// FIRESTORE HELPERS
export const subscribeToData = (userId: string, callback: (data: { accounts: Account[], categories: Category[] }) => void) => {
  return onSnapshot(doc(db, "users", userId), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        accounts: data.accounts || [],
        categories: data.categories || []
      });
    }
  });
};

export const subscribeToTransactions = (userId: string, callback: (txs: Transaction[]) => void) => {
  const q = query(collection(db, "users", userId, "transactions"), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((doc) => {
      txs.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    callback(txs);
  });
};

export const saveUserData = async (userId: string, accounts: Account[], categories: Category[]) => {
  await setDoc(doc(db, "users", userId), { accounts, categories }, { merge: true });
};

export const addFirebaseTransaction = async (userId: string, tx: Omit<Transaction, "id">) => {
  await addDoc(collection(db, "users", userId, "transactions"), {
    ...tx,
    createdAt: serverTimestamp()
  });
};

export const updateFirebaseTransaction = async (userId: string, txId: string, tx: Partial<Transaction>) => {
  await updateDoc(doc(db, "users", userId, "transactions", txId), tx);
};

export const deleteFirebaseTransaction = async (userId: string, txId: string) => {
  await deleteDoc(doc(db, "users", userId, "transactions", txId));
};
