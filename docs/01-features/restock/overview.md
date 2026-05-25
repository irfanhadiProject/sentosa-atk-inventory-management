# Restock Module - Overview

## 1. Description

The Restock Module provides store operators with a structured workflow to log incoming stationery supply increments. It allows operators to build a localized batch of items to be replenished, validate quantities, and push batch stock adjustments directly to Firebase Firestore while maintaining synchronization with the store's global ledger.

## 2. Core Capabilities

- **Flexible Item Intake:** Supports product identification using both hands-free barcode scanning and lowercase text search.

- **Volatile Restock Basket:** Manages temporary incoming item lists and quantities within a local state before committing to the database.

- **Atomic Supply Increment:** Executes strict transactional increases on individual product stock levels.

- **Automated Inventory Revaluation:** Increases the global asset ledger balance dynamically by multiplying incoming product numbers against their active selling prices.

## 3. UI Component Breakdown

The user interface inside `RestockScreen.js` relies on three core functional areas:

1. **Intake Viewport & Search Bar:** Integrates the camera scanner or the `SearchProduct` input bar to locate existing items in the database.

2. **Restock Workspace List:** A dedicated data view rendering the temporary list of items prepared for replenishment, along with their targeted restock numbers.

3. **Commit Action Banner:** Houses the main validation trigger and the call-to-action button to save the restock batch.

## 4. Feature Use Cases Mapping

The operational behaviors for this module are broken down into individual files within the `use-cases/` directory:

- [Scan Restock Item](use-cases/scan-restock-item.md): Handles product identification and insertion into the restock basket.

- [Adjust Restock Quantity](use-cases/adjust-restock-qty.md): Controls the validation and modification of item counts before saving.

- [Commit Restock Batch](use-cases/commit-restock.md): Triggers parallel transactions to update database stock counts and global asset values.