import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Card, Modal, Provider as PaperProvider, Portal, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens & Context
import { CartProvider } from './src/context/CartContext';
import CashierScreen from './src/screens/CashierScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import RestockScreen from './src/screens/RestockScreen';

import Constants from 'expo-constants';
import { Platform, StyleSheet, View } from 'react-native';
import { Colors } from './constants/Colors';
import { checkAPKUpdate } from './src/services/checkUpdateService';
import { checkOTAUpdate } from './src/services/otaUpdateService';
import { runAPKUpdate } from './src/services/updateService';
import { isMandatoryExpired } from './src/utils/mandatoryUpdateCheck';

const Tab = createBottomTabNavigator();

export default function App() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const updateChecked = useRef(false);

  useEffect(() => {
    if (updateChecked.current) return;
    
    updateChecked.current = true;
    initializeUpdate();
  }, []);

  const initializeUpdate = async () => {
    const otaApplied = await checkOTAUpdate();

    if (otaApplied) return;
  
    const update = await checkAPKUpdate();
  
    if (!update) return;

    if (update.mandatory) {
      const expired = await isMandatoryExpired(
        update.version,
        update.graceDays || 3
      );

      if (expired) {
        setIsDownloading(true);
        await runAPKUpdate(update, setDownloadProgress, setIsPreparing);
        return;
      }
    }

    setPendingUpdate(update);
    setShowUpdateModal(true);
  };

  const startUpdate = async () => {
    if(!pendingUpdate) return;

    setShowUpdateModal(false);
    setIsDownloading(true);

    await runAPKUpdate(
      pendingUpdate,
      setDownloadProgress,
      setIsPreparing
    );
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <CartProvider>
          <Portal>
            <Modal
              visible={showUpdateModal}
              dismissable={false}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.card}>
                <Card.Content>

                  <Text variant="titleMedium" style={styles.title}>
                    Update tersedia
                  </Text>

                  <Text style={styles.subtitle}>
                    {pendingUpdate?.releaseNotes || "Versi baru tersedia"}
                  </Text>

                  <View style={{ 
                    flexDirection: "row", 
                    justifyContent: "flex-end", 
                    marginTop: 20 
                  }}>
                    <Text
                      style={{ marginRight: 20 }}
                      onPress={() => setShowUpdateModal(false)}
                    >
                      Nanti
                    </Text>

                    <Text
                      style={{ color: Colors.light.primary }}
                      onPress={startUpdate}
                    >
                      Update
                    </Text>
                  </View>

                </Card.Content>
              </Card>
            </Modal>

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