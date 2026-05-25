# Use Case: Save / Update Product

## 1. Characteristics

- **Actor:** Store Operator / Manager

- **Pre-conditions:** `InventoryScreen` is open, and the input payload fields validate against data-type constraints.

- **Post-conditions:** Product changes are committed to the Firestore collection, the search tag is refreshed, and a global financial delta calculation triggers.

## 2. Main Success Scenario

1. The Actor inputs or modifies fields (Barcode/SKU, Name, Price Sell, Current Stock) inside the product form and taps **"Save"**.

2. The application triggers the `saveProduct(barcode, data)` service.

3. The system initiates an atomic `db.runTransaction` pipeline.

4. **Inside the Transaction Room:**

   - The system checks if a product already exists with the given barcode key.

   - If the product exists (Update Mode): The system captures the historical snapshot dat
   
   - If the product does not exist (Creation Mode): Previous asset weights are treated as zero.

   - The system performs a financial asset delta evaluation (**BR-03**).

   - The system formats the product name into lowercase text and appends it to the document payload as `name_lowercase`.

   - The system injects a Firestore server timestamp as `updatedAt`.

   - The system overwrites or merges the data payload into the specific product document reference.

   - The system increments or decrements the centralized `total_asset_value` tracker inside the `metadata/global` document by the calculated delta amount.

5. The transaction commits successfully.

6. The UI notifies the Actor with a success message and re-syncs the inventory list views.

## 3. Alternative Scenarios

**Transaction Conflict / Network Interruption:**

  1. At step 4, the database experiences concurrent write lock constraints or the network drops before commit acknowledgement.

  2. The database forces a rollback. No document metadata shifts, and the global asset ledger is preserved without changes.

  3. The UI unlocks loading states and prompts the Actor to retry saving the product data.