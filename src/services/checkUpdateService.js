import Constants from "expo-constants";
import { isNewerVersion } from "../utils/versionCheck";

const UPDATE_URL = "https://raw.githubusercontent.com/irfanhadiProject/sentosa-atk-inventory-management/refs/heads/main/update.json"

export const checkAPKUpdate = async () => {
  try {
    const res = await fetch(UPDATE_URL);
    const data = await res.json();
    const currentVersion = Constants.expoConfig?.version || "1.0.0";

    if (!data?.version || !data?.apkUrl) return null;
    
    if (isNewerVersion(data.version, currentVersion)) {
      return data;
    }
  } catch (err) {
    console.error("update check failed", err);
  }
  return null;
};