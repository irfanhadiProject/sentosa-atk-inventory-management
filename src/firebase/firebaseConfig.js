import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, increment, setDoc, updateDoc } from 'firebase/firestore';

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
export const db = getFirestore(app);

// Get product function
export const getProductByBarcode = async (barcode) => {
  const docRef = doc(db, 'products', barcode);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Save/Update Product (full update)
export const saveProduct = async (barcode, data) => {
  const docRef = doc(db, 'products', barcode.trim());
  return await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

// Update stock function (decrease the number of stock)
export const updateProductStock = async (barcode, qty) => {
  const docRef = doc(db, 'products', barcode);
  await updateDoc(docRef, {
    stock: increment(-qty)
  });
};

// Restock Product
export const restockProduct = async (barcode, qty) => {
  const docRef = doc(db, 'products', barcode);
  await updateDoc(docRef, {
    stock: increment(qty)
  })
}