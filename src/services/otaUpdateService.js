import * as Updates from "expo-updates";

export const checkOTAUpdate = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();

      return true;
    }
  } catch (e) {
    console.log("OTA error", e);
  }
  return false;
};