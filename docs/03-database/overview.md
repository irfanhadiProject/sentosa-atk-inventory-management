# Database Architecture - Overview

## 1. Description

The Sentosa ATK storage layer relies completely on **Firebase Cloud Firestore**, a cloud-hosted, flexible, NoSQL document-oriented database. It serves as the single remote Source of Truth (SSoT) for retail operations, stock counting, and store metadata. Data is pulled using real-time synchronization streams and stored with local cache persistence boundaries on the mobile device.

## 2. Structural Design Concepts

Firestore does not enforce static schemas or rigid table joins. To optimize query speeds and adapt to NoSQL characteristics, the database layout uses specific architectural choices:

- **Embedded Document Flattening:** Instead of using normalized tables with extensive foreign key joins, entity properties (such as wholesale pricing configs and lowercased indexing tags) are flattened into properties within a single document layer.

- **Atomic Counter Aggregation:** Financial valuation counters (such as `total_asset_value`) are aggregated directly into a centralized document (`metadata/inventory_stats`). This approach lets the mobile client fetch global store summaries with a single document read instead of running expensive, high-compute collection-wide calculations.

- **Server Timestamp Anchoring:** Document modification tracking relies entirely on Firestore server-side timestamps assigned to the `updated_at` field, keeping time evaluation free from client-side device clock manipulation.

## 3. Top-Level Collection Map

The root data tree structure contains two primary collection targets:

1. `products` (Collection): Houses distinct document records representing individual office stationery inventory units, keyed uniquely by their physical barcode or system-generated SKU string.

2. `metadata` (Collection): Contains system configuration and business performance tracking variables. It currently hosts the critical `inventory_stats` document to maintain global business invariants.