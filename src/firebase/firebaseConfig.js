import { decode, encode } from 'base-64';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  initializeFirestore,
  limit,
  orderBy,
  persistentLocalCache,
  query,
  runTransaction,
  setDoc,
  where
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = (() => {
  try { 
    return initializeFirestore(app, {
    localCache: persistentLocalCache({})
  });
  } catch (error) {
    console.error(error)
    return getFirestore(app);
  }
})();

// Synchronize assets value
export const syncInitialAssetValue = async () => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  let totalWealth = 0;

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    totalWealth += (data.stock || 0) * (data.price_sell || 0);
  });

  const statsRef = doc(db, 'metadata', 'inventory_stats');
  await setDoc(statsRef, { total_asset_value: totalWealth }, { merge: true });
  return totalWealth;
};

// Create SKU for products
export const generateSKU = async (category, brand, excludeBarcode = null) => {
  if (!category || !brand) return '';

  const c = (category || 'ATK').substring(0, 3).toUpperCase().padEnd(3,'X');
  const b = (brand || 'GEN').substring(0, 3).toUpperCase().padEnd(3, 'X');
  const prefix = `${c}-${b}`;

  const producsRef = collection(db, 'products');

  const q = query(
    producsRef,
    where("sku", ">=", prefix),
    where("sku", "<=", prefix + "\uf8ff"),
    orderBy("sku", "desc"),
    limit(2)
  );

  try {
    const querySnapshot = await getDocs(q);
    let nextNumber = 0;

    if (!querySnapshot.empty) {
      const lastDoc = querySnapshot.docs.find(doc => doc.id !== excludeBarcode);

      if (lastDoc) {
        const lastSku = querySnapshot.docs[0].data().sku;
        const parts = lastSku.split("-");
        const lastNum = parseInt(parts[parts.length - 1]);
        nextNumber = isNaN(lastNum) ? 0 : lastNum + 1;
      }
    }

    const sequence = String(nextNumber).padStart(3, '0');
    return `${prefix}-${sequence}`;
  } catch (error) {
    console.error(error);
    return `${prefix}-000`;
  }
};

// Get product function
export const getProductByBarcode = async (barcode) => {
  try {
    const docRef = doc(db, 'products', barcode.trim());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) return docSnap.data();

    const q = query(collection(db, 'products'), where("sku", "==", barcode.trim()));
    const querySnapshot = await getDocs(q);

    if(!querySnapshot.empty) return querySnapshot.docs[0].data();

    return null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Save/Update Product (full update)
export const saveProduct = async (barcode, newData) => {
  const docRef = doc(db, 'products', barcode.trim());
  const statsRef = doc(db, 'metadata', 'inventory_stats');

  try {
    await runTransaction(db, async(transaction) => {
      const oldSnap = await transaction.get(docRef);
      const statsSnap = await transaction.get(statsRef);

      const oldData = oldSnap.exists() ? oldSnap.data() : null;
      const oldVal = (oldData?.stock || 0) * (oldData?.price_sell || 0);
      const newVal = (newData.stock || 0) * (newData.price_sell || 0);
      const diff = newVal - oldVal;

      const currentTotal = statsSnap.exists() ? statsSnap.data().total_asset_value : 0;

      transaction.set(docRef, {
        ...newData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (diff !== 0) {
        transaction.update(statsRef, { total_asset_value: currentTotal + diff}, { merge: true });
      }
    });
  } catch (error) {
    console.error("Save Product Error:", error);
    throw error;
  }
};

// Update stock function (decrease the number of stock)
export const updateProductStock = async (barcode, qty) => {
  const docRef = doc(db, 'products', barcode.trim());
  const statsRef = doc(db, 'metadata', 'inventory_stats');
  
  await runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(docRef);
    if (!productSnap.exists()) return;

    const product = productSnap.data();
    const price = product.price_sell || 0;
    const valueReduction = price * qty;

    transaction.update(docRef, { stock: increment(-qty) });
    transaction.update(statsRef, { total_asset_value: increment(-valueReduction)});
  })
};

// Restock Product
export const restockProduct = async (barcode, qty) => {
  const docRef = doc(db, 'products', barcode.trim());
  const statsRef = doc(db, 'metadata', 'inventory_stats');

  try {
    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(docRef);
      const statsSnap = await transaction.get(statsRef);

      if (!productSnap.exists()) throw "Produk tidak ditemukan";

      const product = productSnap.data();
      const price = product.price_sell || 0;
      const valueAddition = price * qty;
      const currentTotal = statsSnap.exists() ? statsSnap.data().total_asset_value : 0;

      transaction.update(docRef, { stock: increment(qty) });
      transaction.set(statsRef, { 
        total_asset_value: currentTotal + valueAddition 
      }, { merge: true });
    });
  } catch (error) {
    console.error("Restock Error:", error);
    throw error;
  }
};

// get zakat report
export const getZakatReport = async () => {
  const statsRef = doc(db, 'metadata', 'inventory_stats');
  const snap = await getDoc(statsRef);
  
  if (snap.exists()) {
    const totalAsset = snap.data().total_asset_value;
    return {
      totalAsset,
      zakatAmount: totalAsset * 0.025,
      lastUpdated: new Date().toLocaleDateString()
    };
  }
  return { totalAsset: 0, zakatAmount: 0 };
};