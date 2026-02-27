import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TextInput as TextInputRN, View } from "react-native";
import { ActivityIndicator, Button, IconButton, List, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProductByBarcode, restockProduct } from "../firebase/firebaseConfig";

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
        <Text>Izin kamera diperlukan untuk restock</Text>
        <Button mode="contained" onPress={requestPermission}>Beri Izin</Button>
      </View>
    )
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
              item.barcode === data ? { ...item, qty: item.qty + 1} : item
            );
          }
          return [...prev, { barcode: data, name: result.name, qty: 1 }];
        })
      } else {
        Alert.alert("Error", "Barang baru? Silakan daftar di Master Data.");
      }
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Gagal koneksi ke Database.");
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 2000);
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
      console.error(e)
      Alert.alert("Error", "Gagal memperbarui stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text 
        variant="headlineSmall"
        style={styles.title}
      >
        Mode Restock (Barang Masuk)
      </Text>

      <View style={styles.cameraWrapper}>
        {cameraActive ? (
        <CameraView 
          onBarcodeScanned={scanned ? undefined : handleScan} 
          style={StyleSheet.absoluteFillObject} 
        />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, {backgroundColor: '#000' }]}/>
        )}
        {loading && <ActivityIndicator animating={true} color="#fff" style={styles.loader}/>}
      </View>

      <View style={styles.listArea}>
        <Text style={styles.subTitle}>Daftar Barang Masuk:</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          {restockList.map((item) => (
            <List.Item
              key={item.barcode}
              title={item.name}
              titleStyle={{ color: '#333', fontWeight: 'bold'}}
              description={`Jumlah Tambahan: ${item.qty} pcs`}
              descriptionStyle={{ color: '#555'}}
              right={() => (
                <View style={styles.rightControlWrapper}>
                  <Button 
                    compact
                    mode="outlined" 
                    onPress={() => updateLocalQty(item.barcode, -1)} 
                    style={styles.qtyButton}
                    textColor="#333"
                  >
                    -
                  </Button>

                  <TextInputRN
                    value={item.qty.toString()}
                    onChangeText={(v) => { 
                      const num = parseInt(v.replace(/[^0-9]/g, '')) || 0;
                      setRestockList(prev => prev.map(i => i.barcode === item.barcode ? {...i, qty: num} : i));
                    }}
                    keyboardType="numeric"
                    style={styles.inputQty}
                  />

                  <Button 
                    compact
                    mode="outlined" 
                    onPress={() => updateLocalQty(item.barcode, 1)} 
                    style={styles.qtyButton}
                    textColor="#333"
                  >
                    +
                  </Button>

                  <IconButton 
                    icon="delete"
                    iconColor="red"
                    size={24}
                    onPress={() => setRestockList(prev => prev.filter(i => i.barcode !== item.barcode))}
                  />
                </View>
              )}
            />
          ))}
        </ScrollView>
      </View>

      <Button 
        mode="contained" 
        icon="database-import" 
        onPress={handleUpdateStock} 
        disabled={restockList.length === 0 || loading}
        style={styles.submitButton}
        buttonColor="#6200ee"
        textColor="#fff"
      >
        KONFIRMASI BARANG MASUK
      </Button>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fdfcfe' 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    textAlign: 'center', 
    marginVertical: 15, 
    fontWeight: 'bold', 
    color: '#1976d2' 
  },
  subTitle: { 
    marginLeft: 15, 
    fontWeight: '600', 
    marginBottom: 5,
    color: '#333'
  },
  cameraWrapper: { 
    width: '90%', 
    height: 160, 
    alignSelf: 'center', 
    overflow: 'hidden', 
    borderRadius: 20, 
    borderWidth: 3, 
    borderColor: '#1976d2' 
  },
  loader: { 
    position: 'absolute', 
    top: '40%', 
    left: '45%' 
  },
  listArea: { 
    flex: 1, 
    paddingHorizontal: 10, 
    marginTop: 10 
  },
  rightControlWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center',
    width: '42%'
  },
  qtyButton: { 
    width: 30, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 0, 
    marginHorizontal: 3 
  },
  inputQty: {
    color: '#333',
    width: 45, 
    height: 40, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    textAlign: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 4 
  },
  submitButton: { 
    margin: 20, 
    paddingVertical: 8, 
  }
});