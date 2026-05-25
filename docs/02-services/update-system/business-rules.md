# Update System Service - Business Rules

## BR-01: Semver Strict Priority Verification

- **Statement:** Version comparison evaluations must follow strict semantic versioning rules (`Major.Minor.Patch`) to prevent downgrades or loops.

- **Enforcement:** The application utility `versionCheck.js` parses version values into integer arrays and processes comparisons sequentially from left to right:

  $$\text{Major} \rightarrow \text{Minor} \rightarrow \text{Patch}$$

  An update track will only trigger if the extracted numerical sequence of the remote manifest strictly outranks the running client configuration constants.

## BR-02: Localized Clock Dependency

- **Statement:** The calculation of the upgrade grace days period must be managed independently on the client side using persistent storage.

- **Enforcement:** The system does not request server-side epoch dates to check grace targets. Instead, `isMandatoryExpired` leverages local `AsyncStorage` records. The initial discovery timestamp is permanently locked on the device memory for that specific version identity, making the grace calculation resilient against remote endpoint time drifts.

## BR-03: Post-Download Integrity Guardrail

- **Statement:** The native installer subsystem must block installation steps if the downloaded binary data cannot be verified.

- **Enforcement:** The system strictly enforces a post-download cryptographic validation rule. The package installer intent within `apkInstallerService.js` is structurally gated behind the output of `verifyFile()`. If the calculated MD5 fingerprint varies from the remote `update.json` hash entry, the application halts execution to prevent the system from executing incomplete packages.

## BR-04: Mandatory Lockout Constraint

- **Statement:** When a native software version outgrows its optional grace days threshold, the application must prevent the user from accessing business operations.

- **Enforcement:** Enforced at the UI layout layer. If the grace period check returns true, the client renders a permanent overlay block layout that hides navigation tabs, the cashier screen, and inventory controls, forcing the application to remain unusable until the installation workflow is completed.