import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Card, Modal, Provider as PaperProvider, Portal, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens & Context
import { CartProvider } from './src/context/CartContext';
import CashierScreen from './src/screens/CashierScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import RestockScreen from './src/screens/RestockScreen';

import Constants from 'expo-constants';
import { cacheDirectory, createDownloadResumable, getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Colors } from './constants/Colors';

const UPDATE_URL = "https://raw.githubusercontent.com/irfanhadiProject/sentosa-atk-inventory-management/refs/heads/main/update.json";

const Tab = createBottomTabNavigator();

export default function App() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const appVersion = Constants.expoConfig?.version || "1.0.0";

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
    if (!url) {
      Alert.alert("Error", "Link download tidak ditemukan di server.");
      return;
    }

    const fileUri = cacheDirectory + "SentosaATK_Update.apk";
    setIsDownloading(true)
    setIsPreparing(false);
    setDownloadProgress(0);

    try {
      const callback = (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        setDownloadProgress(progress);
      };

      const downloadResumable = createDownloadResumable(url, fileUri, {}, callback);
      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        setIsPreparing(true);

        const cUri = await getContentUriAsync(result.uri);

        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 1500));

          await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
            data: cUri,
            flags: 3, 
            type: 'application/vnd.android.package-archive',
          });
        }

        setTimeout(() => {
          setIsDownloading(false);
          setIsPreparing(false);
        }, 3000);
      }
    } catch (e) {
      setIsDownloading(false);
      setIsPreparing(false);

      console.error(e);
      Alert.alert("Gagal", e.toString());
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <CartProvider>
          <Portal>
            <Modal 
              visible={isDownloading} 
              dismissable={false} 
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.title}>
                    {isPreparing ? "Menyiapkan Instalasi" : "Mengunduh Update"}
                  </Text>

                  <ProgressBar 
                    progress={downloadProgress} 
                    indeterminate={isPreparing}
                    color={Colors.light.primary} 
                    style={styles.progressBar} 
                  />

                  {!isPreparing && (
                    <Text style={styles.percentage}>
                      {Math.round(downloadProgress * 100)}%
                    </Text>
                  )}

                  <Text style={styles.subtitle}>
                    {isPreparing 
                      ? "Sedang membuka installer Android, mohon tunggu"
                      : "Mohon jangan tutup aplikasi sampai installer muncul"}
                  </Text>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          <NavigationContainer>
            <View style={styles.topHeader}>
              <Text style={styles.brandText}>Sentosa ATK</Text>
              <Text style={styles.versionTextTop}>v{appVersion}</Text>
            </View>

            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                  let iconName;
                  if (route.name === 'Kasir') iconName = 'cash-register';
                  else if (route.name === 'Restock') iconName = 'database-import';
                  else if (route.name === 'Produk') iconName = 'archive-settings';
                  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.light.primary,
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

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: 10,
    backgroundColor: Colors.light.background,
  },
  title: {
    textAlign: 'center',
    marginBottom: 15,
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  percentage: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    color: Colors.light.text,
  },
  topHeader: {
    height: 40,
    backgroundColor: Colors.light.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  brandText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  versionTextTop: {
    fontSize: 10,
    color: 'gray',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});