import AsyncStorage from "@react-native-async-storage/async-storage";

export const logUpdate = async (version) => {
  await AsyncStorage.setItem(
    "last_update",
    JSON.stringify({
      version,
      installedAt: new Date().toISOString()
    })
  );
};