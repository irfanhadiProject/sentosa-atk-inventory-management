import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { verifyFile } from "../utils/verifyFile";
import { isNewerVersion } from "../utils/versionCheck";
import { installAPK } from "./apkInstallerService";
import { downloadAPK } from "./downloadService";
import { logUpdate } from "./updateLogger";

const APK_PATH = FileSystem.cacheDirectory + "sentosa-update.apk";
const STORAGE_DOWNLOADED = "lastDownloadedUpdate";
const STORAGE_HIGHEST = "highestInstalledVersion";

export const runAPKUpdate = async (
  updateData,
  setProgress,
  setPreparing
) => {
  try {
    if (!updateData?.apkUrl || !updateData?.checksum || !updateData?.version) {
      throw new Error("invalid update data");
    }

    setProgress?.(0);

    let uri = APK_PATH;

    const highest = await AsyncStorage.getItem(STORAGE_HIGHEST);

    if (highest && !isNewerVersion(updateData.version, highest)) {
      console.log("rollback blocked:", updateData.version, "<=", highest);
      return;
    }
    
    const lastDownloaded = await AsyncStorage.getItem(STORAGE_DOWNLOADED);

    if (lastDownloaded === updateData.version) {
      const existing = await FileSystem.getInfoAsync(uri);

      if (existing.exists) {
        setPreparing?.(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        await AsyncStorage.setItem(STORAGE_HIGHEST, updateData.version);
        await installAPK(uri);
        return;
      }
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists) {
      uri = await downloadAPK(
        updateData.apkUrl, 
        APK_PATH, 
        setProgress
      );
    }

    const valid = await verifyFile(
      uri,
      updateData.checksum
    );

    if (!valid) {
      await FileSystem.deleteAsync(uri, { idempotent: true });

      uri = await downloadAPK(
        updateData.apkUrl, 
        APK_PATH, 
        setProgress
      );

      const validRetry = await verifyFile(uri, updateData.checksum);

      if (!validRetry) {
        throw new Error("checksum mismatch after retry");
      }
    }

    setPreparing?.(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    await logUpdate(updateData.version);
    await installAPK(uri);

    await AsyncStorage.setItem(STORAGE_HIGHEST, updateData.version); 
    await AsyncStorage.setItem(STORAGE_DOWNLOADED, updateData.version);
  } catch (err) {
    console.error("update failed", err);
    setPreparing?.(false);
    setProgress?.(0);
  }
};