# Inventory Module - Overview

## 1. Description

The Inventory Module manages the lifecycle of stationery stock items within the Sentosa ATK ecosystem. It provides the store operator with interfaces to register new products, update existing pricing or stock metadata, track low inventory counts dynamically, and monitor total asset values stored within the shop.

## 2. Core Capabilities

- **Unified Product Persistence:** Handles both creation and editing of items through a single transactional form interface.

- **Automated Search Normalization:** Automatically builds a lowercase search index field during mutations to support client-side prefix matching.

- **Low Stock Guardrails:** Dynamically identifies and flags products whose active quantities drop below a predefined safety threshold.

- **Atomic Asset Balancer:** Evaluates and pushes the delta shift of financial asset changes back to a global tracking ledger document.

## 3. UI Component Breakdown

The interface within `InventoryScreen.js` relies on these functional visual zones:

1. **Product Ledger List:** A reactive data layout streaming all registered products, filtered or sorted by name or stock urgency.

2. **Dynamic Entry Form:** A dedicated modal or sub-view capturing fields such as barcode/SKU, product name, selling price (`price_sell`), and structural stock limits.

3. **Low Stock Indicators:** Visual warning highlights applied to products that require immediate restocking attention.

## 4. Feature Use Cases Mapping

The technical workflows governing the inventory catalog live inside the separate specification files within the `use-cases/` directory:

- [Save / Update Product](use-cases/save-product.md): Handles transactional product profile writes and automated indexing.

- [Track Low Stock](use-cases/track-low-stock.md): Flags running product inventory counts against safety limits.

- [Sync Asset Value](use-cases/sync-asset-value.md): Coordinates financial adjustments across changes made inside the store catalog.