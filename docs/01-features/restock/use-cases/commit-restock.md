# Use Case: Commit Restock Batch

## 1. Characteristics

- **Actor:** Store Operator / Manager

- **Pre-conditions:** The local restock list contains at least one item, and all item quantities pass validation filters ($\ge 1$).

- **Post-conditions:** Database inventory stock properties increase, global store asset values are adjusted upward, and the local workspace state is cleared.

## 2. Main Success Scenario

1. The Actor checks the restock batch overview layout and taps the **"Restock"** submission button.

2. The application changes its layout state to loading, locking UI inputs to prevent accidental double-clicks.

3. The system fires a `Promise.all()` handler to process data mutations concurrently.

4. For each item in the restock workspace, the system invokes `restockProduct(barcode, qty)`:

   - Opens an isolated `db.runTransaction` pipeline boundary block.

   - Fetches the active product document snapshot to capture current values.

   - Computes the incremented inventory level: `new_stock = current_stock + qty`.

   - Computes the incoming asset value addition based on its retail price point: `valueAddition = product.price_sell * qty`.

   - Saves the updated stock value back into the target product document.
   
   - Increments the `total_asset_value` tracker inside the `metadata/global` document by `valueAddition`.

5. All parallel transaction executions resolve successfully without database locks.

6. The system presents a completion alert toast, purges the local workspace list state, and sets the loading indicator back to false.

## 3. Exception Scenarios (Partial Commit Risk)

**Network Interruption Mid-Batch Execution:**

  1. At step 4, a network drop occurs during execution.

  2. Because the process fires isolated transactions concurrently via `Promise.all()`, some products may successfully register stock increases while others fail.
  
  3. The system catches the error, stops execution, restores user input controls, and flags an alert notification.
  
  4. The Actor must verify which items failed to process and re-run the restock execution for those exceptions.