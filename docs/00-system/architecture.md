# System Architecture

## 1. System Overview

Sentosa ATK is a mobile Point-of-Sale (POS) and inventory management application designed specifically for the Sentosa office stationery store. The application is built using Expo (React Native) on the frontend and connects directly to Firebase Cloud Firestore as a Backend-as-a-Service (BaaS) for real-time data synchronization and local offline persistence.

## 2. Architectural Style

The system adopts a **Client-Driven Architecture** with a feature-oriented directory structure. The application does not utilize a separate custom backend API (such as Express or NestJS). Instead, the mobile client handles all presentation layers, state management, and business logic, while data persistence, real-time sync, and security constraints are delegated directly to the Firebase Firestore SDK.

The system separates concerns across 3 core layers:
1. **Presentation Layer (UI)** 
    
    Responsible for rendering visual components and handling user interactions.

2. **Application Logic & State Layer**

    Manages temporary local states (shopping cart, validations) and orchestrates system services.

3. **Data Layer**
    
    Interacts directly with the Firestore database to perform CRUD operations and execute transactions.

## 3. Layered Component Mapping

### 3.1 Presentation Layer

Responsible for capturing user inputs and displaying inventory data.
- **Screens:** `CashierScreen` (sales transactions), `InventoryScreen` (product management), and `RestockScreen` (incoming inventory supply).
- **Components:** `SearchProduct` (dynamic prefix-based search bar).
- **Navigation:** Built on React Navigation to manage transitions between screens.

### 3.2 Application & State Layer

Manages ephemeral states and bridges the UI components with the database layer.
- **Context:** `CartContext` encapsulates the local shopping cart state (`cart`), exposing functions to append/modify items and reset the cart (`clearCart`).
- **Services:** 
  - Granular data mutation functions inside `firebaseConfig.js` (`saveProduct`, `updateProductStock`, `restockProduct`).
  - System updaters: `updateService.js`, `otaUpdateService.js`, and `apkInstallerService.js` to manage application versioning and OTA patches.

### 3.3 Data Layer

- **Firebase Firestore:** Serves as the remote Single Source of Truth (SSoT).
- **AsyncStorage:** Used on the client side to persist lightweight metadata, such as the timestamp marker for mandatory updates (`updatePrompt_`).

## 4. Design Decisions & Trade-offs

1. **Parallel Multi-Transaction Checkout** 

    The checkout process triggers stock mutations in parallel per item using `Promise.all()`. Each item mutation is wrapped inside its own standalone Firestore transaction via `updateProductStock`.

2. **Local Cart State Management** 
    
    The shopping cart state lives entirely within the device's volatile memory (`CartContext`). Synchronization and database stock deductions only occur when the user explicitly clicks "Checkout", preventing premature data locking.

3. **Asset Calculation via Selling Price** 

    The global financial valuation (`total_asset_value`) is computed in real-time based on the **Selling Price (`price_sell`)** instead of the cost/buying price. This value is adjusted in a centralized metadata document whenever a product mutation occurs.

4. **Auto-Generated SKU & Lowercase Indexing** 

    To circumvent NoSQL Firestore's native full-text search limitations, the system automatically builds and injects a `name_lowercase` field whenever a product is written or updated.

## 5. System Limitations (Current State)

- **Partial Failure Risk on Checkout** 

    Since the checkout routine uses `Promise.all()` to dispatch multiple independent transactions concurrently, a partial failure risk exists. If the network drops mid-execution, some items might successfully register a stock reduction in Firestore while others fail.

- **Lack of Database Idempotency** 

    The database layer does not yet enforce an idempotency key requirement for checkout requests. The application relies on UI-level blocking (disabling the checkout button during its loading state) to mitigate accidental double-posting.

- **Selling Price Asset Inconsistency** 
    
    Calculating assets via the selling price means the dashboard displays the *potential gross revenue valuation* of the stock, rather than the clean, net inventory asset value (capital cost valuation).