# Database Architecture - Security Rules

## 1. Security Overview

Firestore uses declarative access control logic through **Firestore Security Rules**. Because Sentosa ATK operates on a **Client-Driven Architecture** where the mobile application directly reads and writes database documents without an intermediate backend server, enforcing security parameters directly at the database layer is critical.

## 2. Production Security Rules Configuration

Below is the exact declarative rule configuration (`firestore.rules`) applied to the Firebase console repository:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read: if true;
      allow write: if 
        request.resource.data.stock >= 0 &&
        (
          (resource == null && request.resource.data.name is string) ||
          (resource != null)
        );
    }
    match /metadata/inventory_stats {
      allow read: if true;
      allow write: if request.resource.data.total_asset_value is number;
    }
  }
}
```
## 3. Rule Enforcement & Invariants

- **Public Read Access** (`if true`): Both `products` and the `metadata/inventory_stats` collection are configured for public read accessibility, allowing the mobile client to stream live product states and synchronization data without forcing immediate authentication gates.

- **Strict Stock Non-Negative Constraint** (`stock >= 0`): The write validator explicitly blocks any data write operation—including checkouts or manual adjustments—that results in a product stock value falling below zero.

- **Polymorphic Mutation Gates** 
  - **On Creation** (`resource == null`): The system enforces an invariant requirement where a valid `name` string property must be provided to successfully initialize the document template.

  - **On Update** (`resource != null`): Existing documents bypass the initial string assignment constraint, allowing granular numeric adjustments (like stock counts) to execute efficiently.

- **Type Guard Validation**: Writes to the `metadata/inventory_stats` path are physically gated to ensure that the tracking ledger key (`total_asset_value`) can only accept clean numeric modifications, preventing type corruptions.