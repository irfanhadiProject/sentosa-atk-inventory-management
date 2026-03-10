import AsyncStorage from "@react-native-async-storage/async-storage";

export const isMandatoryExpired = async (version, graceDays = 3) => {
  const key = `updatePrompt_${version}`;
  const firstSeen = await AsyncStorage.getItem(key);

  const now = Date.now();

  if (!firstSeen) {
    await AsyncStorage.setItem(key, now.toString());
    return false;
  }

  const diffDays =
    (now - Number(firstSeen)) / (1000 * 60 * 60 * 24);

  return diffDays >= graceDays;
};