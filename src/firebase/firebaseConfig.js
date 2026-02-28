import { decode, encode } from 'base-64';
import { initializeApp } from 'firebase/app';
import {
  doc,
  getDoc,
  increment,
  initializeFirestore,
  persistentLocalCache,
  setDoc,
  updateDoc
} from 'firebase/firestore';

if (!global.btoa) { global.btoa = encode; }
if (!global.atob) { global.atob = decode; }

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});

// Get product function
export const getProductByBarcode = async (barcode) => {
  try {
    const docRef = doc(db, 'products', barcode.trim());
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Save/Update Product (full update)
export const saveProduct = async (barcode, data) => {
  const docRef = doc(db, 'products', barcode.trim());
  return await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

// Update stock function (decrease the number of stock)
export const updateProductStock = async (barcode, qty) => {
  const docRef = doc(db, 'products', barcode.trim());
  await updateDoc(docRef, {
    stock: increment(-qty)
  });
};

// Restock Product
export const restockProduct = async (barcode, qty) => {
  const docRef = doc(db, 'products', barcode.trim());
  await updateDoc(docRef, {
    stock: increment(qty)
  })
}