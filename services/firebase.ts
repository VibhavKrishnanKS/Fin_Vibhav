
// Firebase modular SDK imports
// Fix: Import initializeApp as a named export from the firebase/app module
import { initializeApp } from "firebase/app";
// Fix: Consolidate auth imports and separate User as a type-only import to resolve member export errors
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import type { User } from "firebase/auth";
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
import type { Transaction, Account, Category } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// Using firebaseApp name to avoid potential conflicts with local or module scoping
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// UTILITY: Firestore doesn't accept 'undefined'. This function removes such fields.
const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
};

export const loginUser = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerUser = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logoutUser = () => signOut(auth);

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
    } else {
      callback({ accounts: [], categories: [] });
    }
  }, (error) => {
    console.error("Firestore Subscription Error (User Data):", error);
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
  }, (error) => {
    console.error("Firestore Subscription Error (Transactions):", error);
  });
};

export const saveUserData = async (userId: string, accounts: Account[], categories: Category[]) => {
  try {
    const data = cleanData({ accounts, categories });
    await setDoc(doc(db, "users", userId), data, { merge: true });
    console.log("Firestore: User data (accounts/categories) saved successfully.");
  } catch (error) {
    console.error("Firestore Error (saveUserData):", error);
    throw error;
  }
};

export const addFirebaseTransaction = async (userId: string, tx: Omit<Transaction, "id">) => {
  try {
    const data = cleanData({
      ...tx,
      createdAt: serverTimestamp()
    });
    const docRef = await addDoc(collection(db, "users", userId, "transactions"), data);
    console.log("Firestore: Transaction added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Firestore Error (addFirebaseTransaction):", error);
    throw error;
  }
};

export const updateFirebaseTransaction = async (userId: string, txId: string, tx: Partial<Transaction>) => {
  try {
    const data = cleanData(tx);
    await updateDoc(doc(db, "users", userId, "transactions", txId), data);
    console.log("Firestore: Transaction updated successfully.");
  } catch (error) {
    console.error("Firestore Error (updateFirebaseTransaction):", error);
    throw error;
  }
};

export const deleteFirebaseTransaction = async (userId: string, txId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId, "transactions", txId));
    console.log("Firestore: Transaction deleted successfully.");
  } catch (error) {
    console.error("Firestore Error (deleteFirebaseTransaction):", error);
    throw error;
  }
};
