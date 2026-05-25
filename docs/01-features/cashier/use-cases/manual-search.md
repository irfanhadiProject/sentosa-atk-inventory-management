# Use Case: Manual Product Search

## 1. Characteristics

- **Actor:** Store Cashier / Operator

- **Pre-conditions:** The application is open and `CashierScreen` is actively focused.

- **Post-conditions:** The selected item is added to the temporary shopping cart context list, and the search display elements are cleared.

## 2. Main Success Scenario

1. The Actor types alphanumeric characters into the search input component (`SearchProduct`).

2. The system catches the keystrokes, converts the query string entirely to lowercase format, and launches a Firestore range evaluation query (`startAt`/`endAt`) against the indexed `name_lowercase` field.

3. Firestore streams back an ordered result set containing up to 10 matching product items.

4. The system maps and renders the product results in a clean dropdown preview list over the cashier layout.

5. The Actor taps on the preferred product suggestion item card.

6. The system pushes the product entity into the active `CartContext` list.

7. The system resets the search component text buffer to blank and collapses the dropdown container interface.

## 3. Alternative Scenarios

**No Search Results Match:**

  1. At step 3, the range query returns zero matching records.

  2. The system renders an empty state info message stating "No products found" inside the suggestion layout container.