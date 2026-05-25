# Cashier Module - Overview

## 1. Description

The Cashier Module is the core operational feature of the Sentosa ATK application. It provides a high-efficiency interface for store operators to scan barcodes, manage a temporary retail basket, and process sales checkouts. The module is optimized for single-device operation with real-time stock and dynamic business asset estimation capabilities.

## 2. Core Capabilities

- **Automated Barcode Capture:** Utilizes the device's native camera stream via Expo Camera to execute instant hands-free product lookups.

- **Volatile Cart Management:** Allows real-time item increments, decrements, and manual overrides within a localized memory context before database submission.

- **Dynamic Product Querying:** Fallback mechanism allowing manual product lookups using an optimized prefix-text query input.

- **Coordinated Financial Updates:** Automatically computes potential revenue impacts and syncs individual item stock changes with the store's global ledger upon successful transactions.

## 3. UI Component Breakdown

The user interface within `CashierScreen.js` is partitioned into three key visual areas:

1. **Camera Scanner Viewport:** Bound to the upper region of the screen, operating continuously according to the system's scanner state machine guidelines.

2. **Dynamic Search Bar:** Integrated via the `SearchProduct` component to support manual keystroke lookups when barcodes are missing or unreadable.

3. **Interactive Cart Summary:** A reactive scroll list detailing quantities, individual pricing tiers, subtotals, and the final checkout CTA button.

## 4. Feature Use Cases Mapping

The functional workflows of this module are divided into separate operational specifications located within the `use-cases/` directory:

- [Scan Item via Barcode](use-cases/scan-item.md): Handles hands-free item lookup and automated cart insertion.

- [Manual Product Search](use-cases/manual-search.md): Handles fallback product lookups via lowercase prefix text input.

- [Process Basket Checkout](use-cases/process-checkout.md): Orchestrates parallel atomic transactions to commit sales and adjust store assets.