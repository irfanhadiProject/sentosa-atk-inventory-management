# Use Case: Scan Restock Item

## 1. Characteristics

- **Actor:** Store Operator / Manager

- **Pre-conditions:** `RestockScreen` is active, and the Scanner State Machine status is `IDLE`.

- **Post-conditions:** The product is appended to the local restock basket state, and the scanner returns to an `IDLE` state.

## 2. Main Success Scenario

1. The Actor points the device camera at the supplier's product barcode.

2. The camera module reads the barcode data, and the system switches the scanner state machine to `PROCESSING`.

3. The system executes a Firestore query matching the `barcode` or `sku` field.

4. The system successfully retrieves the product document snapshot.

5. The system checks the local restock context list:

   - If the product is not in the list, it adds the product with an initial restock `qty: 1`.

   - If the product already exists, it increments the existing restock `qty` property by 1.

6. The system triggers a success confirmation, initiates a 1000ms `COOLDOWN` delay timer to prevent accidental double reads, and automatically reverts the state machine back to `IDLE`.

## 3. Alternative Scenarios

- **Barcode Unreadable / Missing (Manual Fallback):**

  1. At step 1, the product barcode is damaged or missing.

  2. The Actor types the product name into the search bar input.

  3. The system runs a lowercase prefix match and displays the product suggestions.

  4. The Actor taps the correct product item card, adding it directly into the restock basket list.

- **Product Registry Absence:**

  1. At step 4, the database lookup returns zero records.
  
  2. The system flags an error toast stating the item must be registered in the Inventory Module first before it can receive restock supplies.