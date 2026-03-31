import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { Alert, Keyboard, ScrollView, StyleSheet, TextInput as TextInputRN, TouchableWithoutFeedback, View } from "react-native";
import { ActivityIndicator, Button, Card, IconButton, List, Snackbar, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from '../../constants/Colors';
import SearchProduct from '../components/SearchProduct';
import { getProductByBarcode, restockProduct } from "../firebase/firebaseConfig";
import { sharedStyles } from '../styles/sharedStyles';

export default function RestockScreen() {
  const isFocused = useIsFocused();

  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restockList, setRestockList] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let timeout;
    if (isFocused && !isSearching) {
      timeout = setTimeout(() => {
        setCameraActive(true);
      }, 500);
    } else {
      setCameraActive(false);
    }

    return () => clearTimeout(timeout);
  }, [isFocused, isSearching]);

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

   // Snackbar helper function
   const showToast = (message) => {
    setSnackMsg(message);
    setSnackbarVisible(true);
  };

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
        showToast("Barang baru? Tambahkan barang di menu produk.");
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal koneksi ke Database.");
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
      showToast("Stok gudang telah diperbarui!");
      setRestockList([]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal memperbarui stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsSearching(false);
      }}
    >
      <View style={{ flex:1 }}>
        <SafeAreaView style={sharedStyles.container}>
          <Text variant="headlineSmall" style={sharedStyles.title}>
            Restock (Barang Masuk)
          </Text>
    
          <View style={{ paddingHorizontal: 20 }}>
            <SearchProduct
              placeholder="Cari barang untuk restock..."
              onSelect={(item) => {
                setRestockList(prev => {
                  const existing = prev.find(i => i.barcode === item.id);
      
                  if (existing) {
                    return prev.map(i =>
                      i.barcode === item.id
                        ? { ...i, qty: i.qty + 1 }
                        : i
                    );
                  }
      
                  return [
                    ...prev,
                    {
                      barcode: item.id,
                      name: item.name,
                      qty: 1
                    }
                  ];
                });
              }}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(false)}
            />
          </View>
    
          <View style={sharedStyles.cameraWrapper}>
            {cameraActive && isFocused ? (
              <CameraView 
                key="restock-camera-resource"
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
    
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2500}
            wrapperStyle={{ bottom: 80 }}
            action={{ 
              label: 'OK', 
              onPress: () => setSnackbarVisible(false) 
            }}
          >
            {snackMsg}
          </Snackbar>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
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