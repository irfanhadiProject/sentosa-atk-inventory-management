import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

export const installAPK = async (fileUri) => {
  const contentUri = await FileSystem.getContentUriAsync(fileUri);

  await IntentLauncher.startActivityAsync(
    "android.intent.action.VIEW",
    {
      data: contentUri,
      flags: 1 | 268435456,
      type: "application/vnd.android.package-archive"
    }
  );
};