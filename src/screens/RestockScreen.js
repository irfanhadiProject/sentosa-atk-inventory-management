import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TextInput as TextInputRN, View } from "react-native";
import { ActivityIndicator, Button, Card, IconButton, List, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from '../../constants/Colors';
import { getProductByBarcode, restockProduct } from "../firebase/firebaseConfig";
import { sharedStyles } from '../styles/sharedStyles';

export default function RestockScreen() {
  const isFocused = useIsFocused();
  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restockList, setRestockList] = useState([]);

  useEffect(() => {
    let timeout;
    if (isFocused) {
      timeout = setTimeout(() => {
        setCameraActive(true);
      }, 500);
    } else {
      setCameraActive(false);
    }
    return () => clearTimeout(timeout);
  }, [isFocused]);

  if (!permission?.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: Colors.light.text, marginBottom: 20, fontSize: 18 }}>
          Izin kamera diperlukan untuk restock
        </Text>
        <Button 
          mode="contained" 
          onPress={requestPermission}
          buttonColor={Colors.light.primary}
          textColor={Colors.light.background}
        >
          Beri Izin
        </Button>
      </View>
    );
  }

  const handleScan = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const result = await getProductByBarcode(data);
      if (result) {
        setRestockList(prev => {
          const existing = prev.find(item => item.barcode === data);
          if (existing) {
            return prev.map(item =>
              item.barcode === data ? { ...item, qty: item.qty + 1 } : item
            );
          }
          return [...prev, { barcode: data, name: result.name, qty: 1 }];
        });
      } else {
        Alert.alert("Error", "Barang baru? Silakan daftar di Master Data.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal koneksi ke Database.");
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const updateLocalQty = (barcode, amount) => {
    setRestockList(prev => prev.map(item => 
      item.barcode === barcode 
        ? { ...item, qty: Math.max(1, item.qty + amount) } 
        : item
    ));
  };

  const handleUpdateStock = async () => {
    if (restockList.length === 0) return;
    setLoading(true);

    try {
      await Promise.all(restockList.map(item => restockProduct(item.barcode, item.qty)));
      Alert.alert("Berhasil", "Stok gudang telah diperbarui!");
      setRestockList([]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal memperbarui stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={sharedStyles.container}>
      <Text variant="headlineSmall" style={sharedStyles.title}>
        Restock (Barang Masuk)
      </Text>

      <View style={sharedStyles.cameraWrapper}>
        {cameraActive ? (
          <CameraView 
            onBarcodeScanned={(scanned || loading) ? undefined : handleScan} 
            style={StyleSheet.absoluteFillObject} 
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}/>
        )}
        
        {loading && (
          <View style={[StyleSheet.absoluteFillObject, sharedStyles.cameraLoadingOverlay]}>
            <ActivityIndicator animating={true} color={Colors.light.primary} size="large" />
            <Text style={sharedStyles.loadingText}>Memproses...</Text>
          </View>
        )}
      </View>

      <View style={styles.listArea}>
        <Text variant="titleSmall" style={styles.subTitle}>
          DAFTAR BARANG MASUK:
        </Text>
        
        <ScrollView 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 5 }}
        >
          {restockList.map((item) => (
            <List.Item
              key={item.barcode}
              title={item.name}
              titleStyle={styles.itemTitle}
              description={`Jumlah Tambahan: ${item.qty} pcs`}
              descriptionStyle={{ color: Colors.light.primary, fontWeight: '500' }}
              right={() => (
                <View style={sharedStyles.rightControlWrapper}>
                  <Button 
                    compact mode="outlined" 
                    onPress={() => updateLocalQty(item.barcode, -1)} 
                    style={sharedStyles.qtyButton}
                    textColor={Colors.light.text}
                    contentStyle={{ width: 35, height: 35 }}
                  > - </Button>

                  <TextInputRN
                    value={item.qty.toString()}
                    onChangeText={(v) => { 
                      const num = parseInt(v.replace(/[^0-9]/g, '')) || 0;
                      setRestockList(prev => prev.map(i => i.barcode === item.barcode ? {...i, qty: num} : i));
                    }}
                    keyboardType="numeric"
                    style={sharedStyles.inputQty}
                  />

                  <Button 
                    compact mode="outlined" 
                    onPress={() => updateLocalQty(item.barcode, 1)} 
                    style={sharedStyles.qtyButton}
                    textColor={Colors.light.text}
                    contentStyle={{ width: 35, height: 35 }}
                  > + </Button>

                  <IconButton 
                    icon="delete-outline"
                    iconColor={Colors.light.danger}
                    size={24}
                    onPress={() => setRestockList(prev => prev.filter(i => i.barcode !== item.barcode))}
                  />
                </View>
              )}
              style={styles.listItem}
            />
          ))}
          {restockList.length === 0 && (
            <Text style={styles.emptyText}>Belum ada item yang di-scan.</Text>
          )}
        </ScrollView>
      </View>

      <Card style={styles.bottomCard}>
        <Button 
          mode="contained" 
          icon="database-import" 
          onPress={handleUpdateStock} 
          disabled={restockList.length === 0 || loading}
          style={styles.submitButton}
          buttonColor={Colors.light.primary}
          textColor={Colors.light.surface}
          contentStyle={{ height: 50 }}
        >
          KONFIRMASI STOK MASUK
        </Button>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.light.background
  },
  subTitle: { 
    marginLeft: 10, 
    fontWeight: 'bold', 
    color: Colors.light.subtext,
    letterSpacing: 1
  },
  listArea: { 
    flex: 1, 
    paddingHorizontal: 10, 
    marginTop: 15 
  },
  listItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1
  },
  itemTitle: { 
    color: Colors.light.text, 
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: Colors.light.subtext,
    fontStyle: 'italic'
  },
  bottomCard: {
    padding: 15,
    backgroundColor: Colors.light.surface,
    elevation: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  submitButton: { 
    borderRadius: 10,
  }
});