# Use Case: Download and Install Native APK

## 1. Characteristics

- **Actor:** Store Operator / Managed System Constraint

- **Pre-conditions:** The update modal container is visible on screen, and the Operator clicks the update action control.

- **Post-conditions:** The physical software package payload is downloaded into cache storage, validated for data integrity, and passed to the native Android OS installer.

## 2. Main Success Scenario

1. The Operator taps the confirmation **"Update Now"** button on the UI update prompt component view.

2. The application invokes `downloadService.js` to initialize an asynchronous file download stream aimed at the remote binary URI destination.

3. The background stream saves the package file data directly into the application's local sandbox storage directory (`FileSystem.documentDirectory`).

4. Upon download completion, the system executes `verifyFile(uri, expectedHash)` to evaluate package signatures.

5. The utility extracts the native MD5 cryptographic hash from the saved file and compares it against the expected hash string specified in the remote manifest.

6. The hashes match, validating full data integrity (**BR-03**).

7. The system triggers `apkInstallerService.js`, which initiates a native Android intent shell via `expo-intent-launcher` targeting the verified file cache location.

8. The standard Android OS package installation overlay opens, taking over the device screen to complete the software upgrade.

## 3. Alternative Scenarios

**Storage Space Depletion Error:**

  1. At step 3, the file download stream fails because the mobile device has run out of local storage capacity.

  2. The system intercepts the low-space exception code, stops the download task, cleans up partial data trails, and flags a warning alert telling the operator to free up device space.