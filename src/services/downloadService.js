import * as FileSystem from "expo-file-system/legacy";

export const downloadAPK = async (url, destination, onProgress) => {
  await FileSystem.deleteAsync(destination, { idempotent: true });

  const download = FileSystem.createDownloadResumable(
    url,
    destination,
    {},
    progress => {
      const total = progress.totalBytesExpectedToWrite;

      const ratio = total 
        ? progress.totalBytesWritten / total
        : 0;
        
      onProgress?.(ratio);
    }
  );
  const result = await download.downloadAsync();

  if (!result || result.status !== 200) {
    throw new Error("APK download failed");
  }
  
  return result.uri;
};