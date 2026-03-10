import * as FileSystem from "expo-file-system/legacy";

export const verifyFile = async (uri, expectedHash) => {
  try {
    const info = await FileSystem.getInfoAsync(uri, { md5: true });

    if (!info.exists) return false;

    return info.md5 === expectedHash;
  } catch (err) {
    console.log("verify error", err);
    return false;
  }
};