import * as IntentLauncher from "expo-intent-launcher";

export const installAPK = async (uri) => {
  await IntentLauncher.startActivityAsync(
    "android.intent.action.VIEW",
    {
      data: uri,
      flags: 268435456,
      type: "application/vnd.android.package-archive"
    }
  );
};