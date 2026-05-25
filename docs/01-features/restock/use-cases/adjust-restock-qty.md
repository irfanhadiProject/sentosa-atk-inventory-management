# Use Case: Adjust Restock Quantity

## 1. Characteristics

- **Actor:** Store Operator / Manager

- **Pre-conditions:** The product is already added into the local volatile restock basket list view.

- **Post-conditions:** The restock batch quantity changes locally, adhering to operational minimum safety parameters.

## 2. Main Success Scenario

1. The Actor views the active item row inside the restock workspace list layout.

2. The Actor taps the plus (`+`) or minus (`-`) interactive UI controls, or types directly into the number input field.

3. The system intercepts the input value change.

4. The system runs a data check to ensure the input configuration follows **BR-01** (Quantity $\ge 1$).

5. The system saves the adjusted value directly into the item's local state properties.

6. The subtotal indicators refresh dynamically across the interface banner.

## 3. Alternative Scenarios

**Attempting Drop Below Minimum Bounds:**

  1. At step 2, the Actor taps the minus (`-`) control on an item that currently holds a restock quantity of 1.
  
  2. The system blocks further reduction and alerts the Actor, requiring explicit delete confirmation before removing the item from the list entirely.