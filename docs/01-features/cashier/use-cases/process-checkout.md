# Use Case: Process Basket Checkout

## 1. Characteristics

- **Actor:** Store Cashier / Operator

- **Pre-conditions:** The volatile `cart` array contains at least one product line item with a validated operational quantity constraint ($\ge 1$).

- **Post-conditions:** All inventory stock properties are decremented in Firestore, the global revenue ledger asset value tracking is adjusted, and the local volatile cart state is purged.

## 2. Main Success Scenario

1. The Actor clicks the main **"Checkout"** payment action call-to-action button.

2. The application changes the local layout `loading` state to true, causing the payment interface elements to disable.

3. The system triggers a `Promise.all()` asynchronous wrapper mapping across all products stored inside the client cart context array.

4. For each item entry, the system fires an independent database update sequence via `updateProductStock(barcode, qty)`:

   - Initializes a standalone atomic `db.runTransaction` mutex pipeline.
   
   - Fetches the targeted product document snapshot to capture current values.

   - Saves a decremented stock record: `new_stock = current_stock - qty`.
   
   - Modifies the global `total_asset_value` tracker in `metadata/global` document by subtracting the calculated sales asset depreciation: `valueReduction = product.price_sell * qty`.

5. All parallel operations resolve successfully without database locks or network issues.

6. The system presents a "Transaksi Berhasil!" confirmation alert, flushes the shopping cart layout completely via `clearCart()`, and unlocks the checkout interaction elements by setting `loading` back to false.

## 3. Exception Scenarios (Architectural Limits)

**Partial Mid-Checkout Transaction Drop:**

  1. At step 4, the network connection drops or a concurrent conflict causes one or more transactional operations in the parallel execution chain to reject.

  2. Because the process maps separate transactions, the successful updates remain committed while the broken ones roll back, entering a **Partial Failure** state.

  3. The system catches the native JavaScript error object, stops execution, restores user interaction layers, and shows an error banner alert.
  
  4. The Actor must manually verify which remaining items failed to process and re-run checkout operations for those exceptions.