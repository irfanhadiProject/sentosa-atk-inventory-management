# Restock Module - Business Rules

## BR-01: Operational Supply Boundary

- **Statement:** The quantity of items added to a restock batch must be a positive integer greater than or equal to 1.

- **Enforcement:** Enforced at the UI layout level. Input controls must block negative values or empty inputs, and values must pass code validation before the batch can be submitted.

- **Cross-Reference:** Directly managed by [use-cases/adjust-restock-qty.md](use-cases/adjust-restock-qty.md) and checked during submission in [use-cases/commit-restock.md](use-cases/commit-restock.md).

## BR-02: Isolated Batch Scaling

- **Statement:** Restock mutations must map out distinct, isolated transaction scopes per item identity instead of using a single global database lock.

- **Enforcement:** The system maps operations using `Promise.all()`. This approach avoids blocking the entire database catalog, but it means a failure on one item will not automatically roll back changes made to other products in the same restock batch.

- **Cross-Reference:** Documented inside the architectural limits section of [use-cases/commit-restock.md](use-cases/commit-restock.md).

## BR-03: Real-Time Retail Valuation Influx

- **Statement:** Incoming stock increases must update the global asset ledger (`total_asset_value`) relative to the product's listed selling price.

- **Enforcement:** Every transaction inside `restockProduct` must automatically run the asset adjustment formula:

  $$\text{Value Addition} = \text{restock.qty} \times \text{product.price\_sell}$$

  This value must be added directly to the `metadata/global` document within the active transaction block.

- **Cross-Reference:** Enforced during step 4 of the database commit process in [use-cases/commit-restock.md](use-cases/commit-restock.md).

## BR-04: Prior Inventory Registration Requirement

- **Statement:** A product must already exist in the store's central database before it can receive incoming inventory stock replenishment.

- **Enforcement:** If a barcode lookup returns empty during the search phase, the system must block the item from being added to the restock list, requiring the operator to register the product profile first via the Inventory Module.

- **Cross-Reference:** Handled as an alternate flow condition in [use-cases/scan-restock-item.md](use-cases/scan-restock-item.md).