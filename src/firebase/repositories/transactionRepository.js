import { firestore, getDb } from "../firebaseConfig";

// Batch stock mutation to prevent partial success
export const executeBatchCheckout = async (cartItems) => {
  const db = getDb();
  const statsRef = db.collection('metadata').doc('inventory_stats');

  try {
    await db.runTransaction(async (transaction) => {
      let totalBatchValueReduction = 0;
      const updates = [];

      for (const item of cartItems) {
        const productRef = db.collection('products').doc(item.barcode.trim());
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists) {
          const productData = productSnap.data();
          const price = productData.price_sell || 0;
          const qty = item.qty || 0;
          const valueReduction = price * qty ;

          totalBatchValueReduction += valueReduction;

          updates.push({ref: productRef, nextStock: -qty});
        }
      }

      for (const update of updates) {
        transaction.update(update.ref, {
          stock: firestore.FieldValue.increment(update.nextStock)
        });
      }

      transaction.update(statsRef, {
        total_asset_value: firestore.FieldValue.increment(-totalBatchValueReduction)
      });
    });
  } catch (error) {
    console.error("Transaksi gagal atau terjadi error:", error);
    throw error;
  }
};