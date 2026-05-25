# Update System Service - Overview

## 1. Description

The Update System Service is a dual-engine maintenance utility designed to keep the Sentosa ATK mobile client synchronized with the latest software releases. To bypass manual app store deployments, the service orchestrates **Over-The-Air (OTA) updates** for lightweight JavaScript/asset modifications and a **Native APK Installer pipeline** for critical native runtime upgrades.

## 2. Core Capabilities

- **Remote Version Verification:** Fetches and evaluates a remote `update.json` manifest against the running client version using semver parsing utilities.

- **Dual-Engine Routing:** Programmatically routes updates through either the Expo Updates SDK (for runtime JS patches) or a background file download manager (for standalone Android package deployment).

- **Grace-Period Enforcement:** Implements a localized tracking mechanism using `AsyncStorage` to enforce mandatory updates after a specific number of days, blocking store operations if the client is critically out of date.

- **Cryptographic File Validation:** Validates the cryptographic integrity of downloaded APK binaries using MD5 checksum verifications before initiating OS-level installations.

## 3. Sub-Service Component Breakdown

The architecture inside `src/services/` and `src/utils/` is divided into six specialized code blocks:

1. `checkUpdateService.js` & `updateService.js`: The central orchestrators responsible for pulling remote manifests and routing execution threads.

2. `otaUpdateService.js`: Directly interfaces with `expo-updates` to download and apply bundle patches.

3. `downloadService.js`: Manages the background download streams of physical APK files to the device's local file system storage.

4. `apkInstallerService.js`: Coordinates with native Android intents (`expo-intent-launcher`) to trigger the package installer UI.

5. `mandatoryUpdateCheck.js` & `versionCheck.js`: Internal utilities that manage update prompt timing via `AsyncStorage` and parse semver strings.

## 4. Service Use Cases Mapping

The automated operational workflows governing this system service are separated into detailed files inside the `use-cases/` directory:

- [Detect and Route Remote Updates](use-cases/detect-route-update.md): Handles manifest lookup and update engine branching.

- [Evaluate Mandatory Update Urgency](use-cases/evaluate-grace-period.md): Computes grace days tracking thresholds using AsyncStorage.

- [Download and Install Native APK](use-cases/download-install-apk.md): Processes file asset acquisition and native Android intent launch cycles.

- [Recover from File Validation Failure](use-cases/handle-validation-failure.md): Defensive interceptor routing that scrubs corrupted binary downloads.