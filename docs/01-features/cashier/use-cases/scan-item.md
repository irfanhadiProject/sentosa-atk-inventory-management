# Use Case: Scan Item via Barcode

## 1. Characteristics

- **Actor:** Store Cashier / Operator

- **Pre-conditions:** The application is running, `CashierScreen` is open, and the Scanner State Machine status is `IDLE`.

- **Post-conditions:** The product is appended to the local shopping cart with an updated quantity, and the system safely reverts to an `IDLE` scanning state.

## 2. Main Success Scenario

1. The Actor positions the physical product's barcode within the device's native camera viewport.

2. The camera module detects the barcode string data.

3. The system shifts the scanner state machine to `PROCESSING` to lock out concurrent reads.

4. The system executes a Firestore query on the `products` collection matching the `barcode` or `sku` string.

5. The system successfully retrieves a matching product snapshot document.

6. The system checks the local `cart` array inside `CartContext`:
   - If the item is new, it injects the product into the array with `qty: 1`.
   - If the item already exists, it increments the existing `qty` property by 1.

7. The system triggers a success notification toast, initiates a 1000ms `COOLDOWN` delay timer, resets `lastScannedRef` to null, and switches the state machine back to `IDLE`.

## 3. Alternative Scenarios

- **Product Not Found:**

  1. At step 5, Firestore returns an empty query snapshot.

  2. The system triggers an "Item not found" error toast layout.

  3. The system bypasses the cooldown phase and immediately resets the state machine back to `IDLE`.

- **Duplicate Scan Lock:**

  1. At step 1, if a scan is registered while the state machine is in the `COOLDOWN` window.
  
  2. The system drops the incoming camera event packet, enforcing **BR-01** (Preventing unintended double entries).