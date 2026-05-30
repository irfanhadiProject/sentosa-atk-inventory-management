# Database Architecture - Schemas

## 1. Collection: `products`

- **Path:** `/products/{barcode}`

- **Document Key:** Custom string representation matching the product's physical barcode or system-generated SKU string.

### 1.1 Document Structure

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `barcode` | `string` | Unique identifier key matching the physical barcode pattern (often matches the document ID). |
| `sku` | `string` | Stock Keeping Unit identifier code for catalog management. |
| `brand` | `string` | The manufacturer or brand registry name of the item (e.g., "Diamond", "Kiky"). |
| `category` | `string` | Operational grouping category (e.g., "Stopmap", "Buku"). |
| `name` | `string` | Full human-readable product display title. |
| `name_lowercase` | `string` | The product title transformed entirely into lowercase characters. Used for prefix range queries. |
| `price_buy` | `number` | The base capital cost / purchasing price point from distributors. |
| `price_sell` | `number` | The standard retail sales price point inside the cashier workstation. |
| `price_wholesale` | `number` | The discounted price point applied when items are purchased in bulk. |
| `wholesale_qty` | `number` | The minimum volume threshold required to trigger the `price_wholesale` rate. |
| `stock` | `number` | The live running inventory stock quantity count currently present in the store. |
| `updated_at` | `timestamp` | Server-assigned timestamp marking the exact moment of the last mutation event. |
| `min_stock` | `number` | Individual safe guardrail threshold parameter |

### 1.2 JSON Representation Example

```json
{
  "barcode": "8993121111756",
  "sku": "8993121111756",
  "brand": "Diamond",
  "category": "Stopmap",
  "name": "Stopmap Diamond 5002 Hijau",
  "name_lowercase": "stopmap diamond 5002 hijau",
  "price_buy": 3500,
  "price_sell": 4500,
  "price_wholesale": 4000,
  "wholesale_qty": 12,
  "stock": 46,
  "updated_at": "Timestamp(seconds=1716634800, nanoseconds=500000000)"
}
```

### 1.3 Compound Indexes Requirement

To support query filtering and sorting safely without Firestore index errors, the following field configurations are maintained:

- **Single Field Index**: `name_lowercase` (Ascending) -> Supports rapid character prefix typing dropdown lookups.

 - **Compound Index**: `stock` (Ascending) + `name_lowercase` (Ascending) -> Supports low-stock urgency list sorting.

## 2. Collection: `metadata`

- **Path**: `/metadata/{document_id}`

- **Document Key**: Fixed administrative string keys dictating explicit operational contexts.

### 2.1 Document ID: `inventory_stats`

Tracks high-level system states and calculated business performance summaries.

**Field Schema**

| Field Name | Type | Description |
| :--- | :--- | :--- | 
| `total_asset_value` | `number` | The total gross retail financial value of all active store inventory products compiled dynamically via transaction delta rules. |

**JSON Representation Example**

```json
{
  "total_asset_value": 15425000
}
```

