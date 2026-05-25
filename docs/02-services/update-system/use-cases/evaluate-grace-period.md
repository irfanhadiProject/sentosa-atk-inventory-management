# Use Case: Evaluate Mandatory Update Urgency

## 1. Characteristics

- **Actor:** Automated System Boundary

- **Pre-conditions:** The system routing layer has identified an eligible newer native Android package (`type: "apk"`) on the remote server.

- **Post-conditions:** The upgrade urgency state is computed, returning a boolean condition that dictates whether to display an optional alert banner or a total operational lockout UI.

## 2. Main Success Scenario

1. The version management pipeline triggers the `isMandatoryExpired(version, graceDays)` tracking service utility.

2. The engine sends a lookup call to local `AsyncStorage` for a persistence key matching the pattern `updatePrompt_${version}`.

3. The system captures the local storage result data:

   - **Scenario A (First-Time Detection):** If the storage lookup returns null, the system captures the active Unix timestamp, logs it under the version key string inside `AsyncStorage`, and returns `false`. The update is flagged as **Optional**.

   - **Scenario B (Subsequent Evaluation):** If the storage lookup reveals an existing record, the utility parses the entry and measures the delta elapsed duration between the current clock time and the historical discovery timestamp.

4. The system checks if the calculated elapsed duration meets or exceeds the business-defined parameters (`graceDays = 3`):

   - If the duration is within bounds, it returns `false` (**Optional Mode**).
   
   - If the duration exceeds the threshold, it returns `true` (**Mandatory Lockout Mode**), invoking **BR-04** to immediately block application functionality.

## 3. Alternative Scenarios

**Manual Device Clock Manipulation:**

  1. At step 3 (Scenario B), if an operator manually alters their device clock backwards to cheat the system.
  
  2. The calculation results in a negative value or a lower day count, which fails to cross the threshold boundary. The lockout is deferred temporarily until the real-world epoch constraints are satisfied or corrected.