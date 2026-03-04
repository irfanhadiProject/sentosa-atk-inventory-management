import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens & Context
import { CartProvider } from './src/context/CartContext';
import CashierScreen from './src/screens/CashierScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import RestockScreen from './src/screens/RestockScreen';

import Constants from 'expo-constants';
import { cacheDirectory, createDownloadResumable, getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';

const UPDATE_URL = "https://raw.githubusercontent.com/irfanhadiProject/sentosa-atk-inventory-management/refs/heads/main/update.json";

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await fetch(UPDATE_URL);
        const data = await response.json();
        const currentVersion = Constants.expoConfig.version;

        if (data.version !== currentVersion) {
          Alert.alert(
            "Update Tersedia",
            "Aplikasi Sentosa ATK ada versi baru. Download sekarang?",
            [
              { text: "Nanti", style: "cancel" },
              { text: "Update", onPress: () => downloadAndInstall(data.apkUrl) }
            ]
          );
        }
      } catch (e) {
        console.log("Cek update gagal:", e);
      }
    };

    checkUpdate();
  }, []);

  const downloadAndInstall = async (url) => {
    const fileUri = cacheDirectory + "SentosaATK_Update.apk";
    
    try {
      const downloadResumable = createDownloadResumable(url, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      
      const cUri = await getContentUriAsync(uri);

      if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
          data: cUri,
          flags: 1, 
          type: 'application/vnd.android.package-archive',
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Gagal", "Gagal mengunduh atau membuka installer.");
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <CartProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                  let iconName;
                  if (route.name === 'Kasir') iconName = 'cash-register';
                  else if (route.name === 'Restock') iconName = 'database-import';
                  else if (route.name === 'Produk') iconName = 'archive-settings';
                  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
              })}
            >
              <Tab.Screen name="Kasir" component={CashierScreen} />
              <Tab.Screen name="Restock" component={RestockScreen} />
              <Tab.Screen name="Produk" component={InventoryScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </CartProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}