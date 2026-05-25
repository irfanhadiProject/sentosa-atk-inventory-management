# Inventory Module - Business Rules

## BR-01: Low Stock Threshold Constant

- **Statement:** A product profile is flagged as an endangered inventory item when its physical stock count drops to or below a critical boundary limit.

- **Enforcement:** The system evaluates this condition as a client-side layout modifier during rendering. If a product's stock matches this condition, a low stock state is triggered visually across inventory tracking logs.

- **Cross-Reference:** Directly consumed by [use-cases/track-low-stock.md](use-cases/track-low-stock.md).

## BR-02: Search Index String Isolation

- **Statement:** To ensure search speed while reducing computing overhead on Firestore, lookups must avoid regex runtime operations.

- **Enforcement:** Every transaction updating or creating a product must save a string key copy named `name_lowercase` containing only lowercase characters. Manual searches must match against this exact property using string prefix bounds.

- **Cross-Reference:** Implemented during save states in [use-cases/save-product.md](use-cases/save-product.md).

## BR-03: Inventory Valuation Accounting Boundary

- **Statement:** The global store value tracker must account for both price adjustments and stock count updates to stay accurate.

- **Enforcement:** The asset sync process must run inside the exact same transaction block as the product modifications. If a product update alters either the item's price or its current stock count, the system must compute the precise delta adjustment and modify the global asset ledger within that same transaction.

- **Cross-Reference:** Enforced within the core operations of [use-cases/save-product.md](use-cases/save-product.md) and [use-cases/sync-asset-value.md](use-cases/sync-asset-value.md).