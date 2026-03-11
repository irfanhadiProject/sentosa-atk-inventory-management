import firestore from '@react-native-firebase/firestore';

const getDb = () => {
  return firestore();
};

// Synchronize assets value
export const syncInitialAssetValue = async () => {
  const db = getDb();
  const querySnapshot = await db.collection('products').get();
  let totalWealth = 0;

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    totalWealth += (data.stock || 0) * (data.price_sell || 0);
  });

  const statsRef = db.collection('metadata').doc('inventory_stats');
  await statsRef.set({ total_asset_value: totalWealth }, { merge: true });
  return totalWealth;
};

// Create SKU for products
export const generateSKU = async (category, brand, excludeBarcode = null) => {
  if (!category || !brand) return '';

  const c = (category || 'ATK').substring(0, 3).toUpperCase().padEnd(3,'X');
  const b = (brand || 'GEN').substring(0, 3).toUpperCase().padEnd(3, 'X');
  const prefix = `${c}-${b}`;

  try {
    const db = getDb();
    const querySnapshot = await db.collection('products')
      .where("sku", ">=", prefix)
      .where("sku", "<=", prefix + "\uf8ff")
      .orderBy("sku", "desc")
      .limit(2)
      .get();

    let nextNumber = 0;

    if (!querySnapshot.empty) {
      const lastDoc = querySnapshot.docs.find(doc => doc.id !== excludeBarcode);

      if (lastDoc) {
        const lastSku = lastDoc.data().sku;
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
    const db = getDb();
    const docRef = db.collection('products').doc(barcode.trim());
    const docSnap = await docRef.get();

    if (docSnap.exists()) return docSnap.data();

    const querySnapshot = await db.collection('products')
      .where("sku", "==", barcode.trim())
      .get();

    if(!querySnapshot.empty) return querySnapshot.docs[0].data();

    return null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Save/Update Product (full update)
export const saveProduct = async (barcode, newData) => {
  const db = getDb();
  const docRef = db.collection('products').doc(barcode.trim());
  const statsRef = db.collection('metadata').doc('inventory_stats');

  try {
    await db.runTransaction(async (transaction) => {
      const oldSnap = await transaction.get(docRef);
      const statsSnap = await transaction.get(statsRef);

      const oldData = oldSnap.exists() ? oldSnap.data() : null;
      const oldVal = (oldData?.stock || 0) * (oldData?.price_sell || 0);
      const newVal = (newData.stock || 0) * (newData.price_sell || 0);
      const diff = newVal - oldVal;

      const currentTotal = statsSnap.exists() ? statsSnap.data().total_asset_value : 0;

      transaction.set(docRef, {
        ...newData,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (diff !== 0) {
        transaction.update(statsRef, { 
          total_asset_value: currentTotal + diff 
        });
      }
    });
  } catch (error) {
    console.error("Save Product Error:", error);
    throw error;
  }
};

// Update stock function (decrease the number of stock)
export const updateProductStock = async (barcode, qty) => {
  const db = getDb();
  const docRef = db.collection('products').doc(barcode.trim());
  const statsRef = db.collection('metadata').doc('inventory_stats');
  
  await db.runTransaction(async (transaction) => {
    const productSnap = await transaction.get(docRef);
    if (!productSnap.exists()) return;

    const product = productSnap.data();
    const price = product.price_sell || 0;
    const valueReduction = price * qty;

    transaction.update(docRef, { stock: firestore.FieldValue.increment(-qty) });
    transaction.update(statsRef, { total_asset_value: firestore.FieldValue.increment(-valueReduction)});
  })
};

// Restock Product
export const restockProduct = async (barcode, qty) => {
  const db = getDb();
  const docRef = db.collection('products').doc(barcode.trim());
  const statsRef = db.collection('metadata').doc('inventory_stats');

  try {
    await db.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(docRef);
      const statsSnap = await transaction.get(statsRef);

      if (!productSnap.exists()) throw "Produk tidak ditemukan";

      const product = productSnap.data();
      const price = product.price_sell || 0;
      const valueAddition = price * qty;
      const currentTotal = statsSnap.exists() ? statsSnap.data().total_asset_value : 0;

      transaction.update(docRef, { 
        stock: firestore.FieldValue.increment(qty) 
      });
      
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
  const db = getDb();
  const statsRef = db.collection('metadata').doc('inventory_stats');
  const snap = await statsRef.get();
  
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