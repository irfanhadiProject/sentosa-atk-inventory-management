# Use Case: Sync Asset Value

## 1. Characteristics

- **Actor:** Automated System Transaction Boundary

- **Pre-conditions:** An operation alters stock counts or price configurations (`saveProduct`, `handleCheckout`, or `restockProduct`).

- **Post-conditions:** The global metadata ledger tracker syncs perfectly to reflect the new state of the store's retail inventory valuation.

## 2. Main Success Scenario

1. A mutation request enters the transaction block.

2. The system reads the live database constants before modifying them.

3. The mutation block isolates the value differences:

   $$\text{Old Asset Value} = \text{old\_stock} \times \text{old\_price\_sell}$$
   
   $$\text{New Asset Value} = \text{new\_stock} \times \text{new\_price\_sell}$$

   $$\text{Delta Difference (diff)} = \text{New Asset Value} - \text{Old Asset Value}$$

4. The transaction pipeline applies the calculated `diff` to the global tracker:

   $$\text{total\_asset\_value}_{\text{new}} = \text{total\_asset\_value}_{\text{current}} + \text{diff}$$

5. The combined write operation locks and commits atomically, ensuring that a product's stock state never desynchronizes from the global accounting tracker.

## 3. Alternative Scenarios

**Fallback Recovery Run (`syncInitialAssetValue`):**

  1. If structural corruption or an unexpected edge case introduces an error into the global metadata counter tracker.

  2. The Administrator triggers the manual `syncInitialAssetValue()` utility fallback routine.

  3. The utility queries the entire `products` collection, maps across every single record, accumulates the total calculated asset values, and overwrites the `total_asset_value` value inside `metadata/global` with the accurate, recalculated total.
  