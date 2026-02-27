# Sentosa ATK - Smart Inventory & POS System

A mobile-based inventory tracking system for small businesses (ATK Store).

## Tech Stack

- **Frontend:** React Native (Expo)
- **Database:** Firebase Cloud Firestore
- **State Management:** React Context API
- **Tooling:** Expo SDK, Expo Camera

## MVP Features

- **Scan & Check:** Quick price and stock lookup via Barcode.
- **Cashier Mode:** Shopping cart system with automatic stock reduction.
- **Restock Mode:** Easy stock addition for incoming goods.
- **Inventory Management:** CRUD for product master data.

## Database Schema (Firestore)

- Collection: `products`
  - Document ID: `barcode_number`
  - Fields: 
    - `name`
    - `stock`
    - `price_buy`
    - `price_sell` (retail)
    - `price_wholesale` (wholesale)
    - `wholesale_qty` (minimum wholesale quantity)

## Installation

1. `npm install`
2. `npx expo start`

## Application Flow (The Logic)

1. **Initialize:** App checks for Camera Permissions.
2. **Scan Process:** 
   - User scans barcode -> ID is captured.
   - App fetches real-time data from Firestore.
3. **Operations:**
   - **Check Mode:** Display data only (No write).
   - **Cart Mode:** Add to local state -> On "Checkout", execute `increment()` to Firestore.
   - **Restock Mode:** Manual input -> Execute `increment()` to Firestore.

## Folder Structure

```
sistem-inventaris-sentosa-atk/
├── src/
│   ├── components/    # Button, input, etc
│   ├── context/       # Shopping cart logic (Context API)
│   ├── firebase/      # Database function and config
│   └── screens/       # Pages (Scanner, Cashier, Stock)
├── App.js             # App entry point
└── app.json           # App name and icon setting
```

## Out of Scope (Next Development Phase)

To maintain the MVP's focus and stability, the following features are intentionally excluded for now:
- User Authentication (Login/Logout).
- Receipt Printing (POS Hardware integration).
- Sales Analytics & Profit/Loss Graphics.
- Discount Engines & Membership Systems.