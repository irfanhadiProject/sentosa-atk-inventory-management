# Sentosa ATK - Smart Inventory & POS System
> **Current Version:** 1.1.7 (stable)

A mobile-based inventory tracking system for small businesses (office stationery store).

## Tech Stack

- **Frontend:** React Native (Expo)
- **Database:** Firebase Cloud Firestore
- **State Management:** React Context API
- **Tooling:** Expo SDK, Expo Camera

## Features (v1.1.7 Update)

- **Scan & Check:** Quick price and stock lookup via Barcode.
- **Cashier Mode:** Shopping cart system with automatic stock reduction.
- **Restock Mode:** Easy stock addition for incoming goods.
- **Inventory Management:** CRUD for product master data.
- **[NEW] Financial Dashboard:** Real-time calculation of total assets (selling price).
- **[NEW] Automated Zakat:** Integrated Zakat Perniagaan calculator based on nisab.
- **[NEW] Smart SKU:** Auto-generation of SKU for non-barcoded items.
- **[NEW] Version Control:** Built-in version checker to ensure all devices are running the latest stable build.

## Database Schema (Firestore)

### Collection: `products`
- Document ID: `barcode` or `sku` if barcode does not exist
- Fields: 
   - `name`
   - `category` [NEW]
   - `brand` [NEW]
   - `sku` [NEW]
   - `stock`
   - `price_buy`
   - `price_sell` (retail)
   - `price_wholesale` (wholesale)
   - `wholesale_qty` (minimum wholesale quantity)
   - `updated_at` [NEW] (timestamp)

### [NEW] Collection: `metadata`
- Document ID: `inventory_stats`
- Fields:
   - `total_asset_value` (Aggregate of all products price_sell * stock)

## Installation

1. `npm install`
2. `npx expo start`

## Application Flow (Updated)

1. **Initialize:**
   - App checks for version compatibility.
   - App checks for camera permissions.
   - Fetches inventory_stats.
2. **Scan Process:** 
   - User scans barcode -> ID is captured.
   - App fetches real-time data from Firestore.
3. **Operations:**
   - **Check Mode:** Display data only (No write).
   - **Cart Mode:** Add to local state -> On "Checkout", execute `increment()` to Firestore.
   - **Restock Mode:** Manual input -> Execute `increment()` to Firestore.

## Financial Logic

- Every product update triggers a recalculation of `total_asset_value`.
- Zakat status is dynamically calculated: `total_asset >= (85g * Gold Price)`.

*(Note: Gold price is currently hardcoded at Rp3,135,000/gram as of v1.1.7)*

## Folder Structure

```
sistem-inventaris-sentosa-atk/
├── constants/         # Colors.js (Global theme & color palette) [NEW]
├── src/
│   ├── components/    # Button, input, etc
│   ├── context/       # Shopping cart logic (Context API)
│   ├── firebase/      # Database function and config
│   ├── screens/       # Pages (Scanner, Cashier, Stock)
│   └── styles/        # sharedStyles.js (Common layouts) [NEW]
├── App.js             # App entry point
└── app.json           # App name and icon setting
```

## Out of Scope (Next Development Phase)

The following features are intentionally excluded for now:
- User Authentication (Login/Logout).
- Receipt Printing (POS Hardware integration).
- Sales Analytics & Profit/Loss Graphics.
- Discount Engines & Membership Systems.