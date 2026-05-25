# Sentosa ATK - Smart Inventory & POS System
> **Current Version:** 1.4.1 (stable)

A mobile-based inventory tracking and point-of-sale system built on a client-driven architecture, specifically tailored for small retail businesses (office stationery stores).

## Tech Stack

- **Frontend:** React Native (Expo)
- **Database:** Firebase Cloud Firestore
- **State Management:** React Context API (with Volatile Cache Hooks)
- **Local Storage:** AsyncStorage & Expo FileSystem
- **Hardware Integration:** Expo Camera Engine (with Finite State Machine routing)

## Features

- **Scan & Check:** Instant real-time price and stock lookup via a continuous camera stream observer.
- **Cashier Mode:** Localized shopping cart system utilizing atomic transactions (`db.runTransaction`) to process concurrent checkouts.
- **Restock Mode:** Parallel inventory supply replenishment logs with dynamic financial ledger adjustment updates.
- **Inventory Management:** Full transaction-backed CRUD services for core product metadata management.
- **Financial Dashboard:** Real-time atomic counter aggregation of total gross inventory valuation using the selling price.
- **Automated Zakat:** Integrated Zakat Perniagaan compliance calculator that dynamically measures net store eligibility benchmarks based on current Nisab parameters.
- **Smart SKU:** Algorithmic fallback auto-generation engine to assign structural identities to non-barcoded inventory items.
- **Version Control:** Built-in dual-engine maintenance system supporting Over-The-Air (OTA) runtime patches and standalone native APK installer deployments with embedded MD5 checksum signature verifications.
- **[NEW] Optimized Prefix Search:** High-efficiency, low-compute manual product lookup utilizing a dedicated string index (`name_lowercase`).
- **[NEW] Dynamic Low Stock Guardrails:** Real-time evaluation interface that automatically flags and highlights critically low product stock thresholds.

## Database Schema (Firestore)

### Collection: `products`
- **Document ID**: `barcode` or programmatically generated `sku` token string.
- **Fields**: 
   - `name` (string)
   - `name_lowercase` (string) - *[NEW] Normalized lowercase search indexing tag*
   - `category` (string)
   - `brand` (string)
   - `sku` (string)
   - `stock` (number)
   - `price_buy` (number)
   - `price_sell` (number)
   - `price_wholesale` (number)
   - `wholesale_qty` (number)
   - `updated_at` (timestamp) - *Server-assigned mutation timestamp*

### Collection: `metadata`
- **Document ID**: `inventory_stats`
- **Fields**:
   - `total_asset_value` (number) - *Unified atomic aggregator tracking retail asset valuation*

## Installation

1. `npm install`
2. `npx expo start`

## Application Flow (Updated)

1. **Initialize:**
   - App runs semantic version verification for updates (OTA/APK tracks).
   - App checks for hardware camera permission layers.
   - Fetches dynamic state invariants from `metadata/inventory_stats`.
2. **Scan Process / Search:** - User scans a barcode -> Unique ID is captured with a defensive 1000ms `COOLDOWN` timer to lock out double reads.
   - **[NEW]** User types into search component -> System runs a fallback prefix text search string match against the pre-indexed `name_lowercase` field.
3. **Operations:**
   - **Check Mode:** Display real-time data only inside a modal view overlay (No write).
   - **Cart Mode:** Add validation items to local state container -> On "Checkout", execute parallel `db.runTransaction` pipelines via `Promise.all()` to decrease stock and adjust assets.
   - **Restock Mode:** Manual quantity increase entry -> Execute isolated write mutations to increment physical stock levels and scale global financial parameters.

## Financial Logic

- Every product update triggers a recalculation of `total_asset_value`.
- Zakat status compliance verification is calculated dynamically using the following expression:

  $$\text{total\_asset\_value} \ge (85\text{g} \times \text{Gold Price})$$

*(Note: Gold price is currently hardcoded at Rp2,803,000/gram as of v1.4.1)*

## Folder Structure

```
sistem-inventaris-sentosa-atk/
├── constants/         # Colors.js (Global theme & color palette)
├── docs/              # Comprehensive structural blueprint and technical use cases documentation
├── src/
│   ├── components/    # Common layout elements (Button, input, search fields)
│   ├── context/       # Localized shopping cart memory hooks (Context API)
│   ├── firebase/      # Config initializations, access limits, and database drivers
│   ├── screens/       # Views (CashierScreen, InventoryScreen, RestockScreen)
│   ├── services/      # Background sync managers, OTA delivery, and APK installers
│   └── styles/        # sharedStyles.js (Common layouts)
├── App.js             # Core entry framework point
└── app.json           # Shell manifest data and asset settings
```

## Out of Scope (Next Development Phase)

The following features are intentionally excluded for now:
- User Authentication (Login/Logout).
- Receipt Printing (POS Hardware integration).
- Sales Analytics & Profit/Loss Graphics.
- Discount Engines & Membership Systems.