# Cashier Module - Business Rules

## BR-01: Operational Quantity Boundary

- **Statement:** The quantity (`qty`) of any single product identity added to the shopping cart must never drop below 1.

- **Enforcement:** The application UI must strictly enforce this constraint. Tapping the minus (`-`) icon on a cart item with a quantity of 1 must change the interaction model into a deletion prompt or require explicit confirmation to remove the item entirely from the cart list.

- **Cross-Reference:** Implemented as a pre-validation check across all scenario flows in [use-cases/process-checkout.md](use-cases/process-checkout.md).

## BR-02: Parallel Checkout Independent Scoping

- **Statement:** Every individual product line-item checkout operation must be handled in an isolated database transaction room.

- **Enforcement:** The system does not lock the entire store inventory document group under one database mutex during checkouts. Instead, it processes transactions independently using `Promise.all()`. Stock reduction failures on Item A due to database conflicts will not automatically roll back successful stock reductions already committed for Item B within the same checkout cycle.

- **Cross-Reference:** Formally documented in the exception scenarios of [use-cases/process-checkout.md](use-cases/process-checkout.md).

## BR-03: Real-Time Gross Revenue Asset Valuation

- **Statement:** The store's global financial tracker (`total_asset_value`) must adjust relative to the retail value of items passing out of inventory during a checkout event.

- **Enforcement:** Every transaction managed via `updateProductStock` must recalculate the asset reduction value by multiplying the quantity being purchased by the product's listed selling price:

  $$\text{Value Reduction} = \text{cart.qty} \times \text{product.price\_sell}$$

  This resulting total must be immediately deducted from the global ledger document (`metadata/global`) inside the active transaction block.

- **Cross-Reference:** Bound to the core data mutation sequence step 4 in [use-cases/process-checkout.md](use-cases/process-checkout.md).

## BR-04: Automated Lowercase Prefix Indexing

- **Statement:** Manual string lookup queries must support fuzzy prefix searching without requiring high-compute third-party full-text search integration.

- **Enforcement:** Every product creation or data alteration event must programmatically enforce lowercase normalization. The database write operations must maintain a string property named `name_lowercase` representing the exact name of the product transformed into lowercase letters. All client-side text queries must match this field exclusively to guarantee accurate search results.

- **Cross-Reference:** Directly consumed during query compilation in [use-cases/manual-search.md](use-cases/manual-search.md).
