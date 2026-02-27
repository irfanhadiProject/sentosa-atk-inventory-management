import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput as TextInputRN,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  SegmentedButtons,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { getProductByBarcode, updateProductStock } from '../firebase/firebaseConfig';

export default function CashierScreen() {
  const isFocused = useIsFocused();
  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('cashier');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [tempProduct, setTempProduct] = useState(null)
  const { cart, addToCart, updateQty, manualQty, removeFromCart, clearCart, totalPrice } = useCart();

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
        <Text>Izin kamera diperlukan</Text>
        <Button mode="contained" onPress={requestPermission}>Beri Izin</Button>
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
        if (mode === 'cashier') {
          addToCart({ 
            barcode: data, 
            name: result.name, 
            price_sell: result.price_sell ,
            price_wholesale: result.price_wholesale,
            wholesale_qty: result.wholesale_qty
          });
        } else {
          setTempProduct({ 
            ...result, 
            barcode: data,
            price_sell: result.price_sell || 0,
            stock: result.stock || 0
          });
          setShowCheckModal(true)
        }
      } else {
        Alert.alert("Error", "Barang tidak ditemukan!");
      }
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Gagal ambil data.");
    } finally {
      setLoading(false);
      
      if (mode === 'cashier') {
        setTimeout(() => setScanned(false), 2000);
      }
    }
  };

  const closeCheckModal = () => {
    setShowCheckModal(false);
    setTempProduct(null);
    setScanned(false);
  }

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await Promise.all(cart.map(item => updateProductStock(item.barcode, item.qty)));
      Alert.alert("Sukses", "Transaksi Berhasil!");
      clearCart();
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Gagal update stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Sentosa Kasir</Text>

      <View style={{ paddingHorizontal: 20, marginBottom: 15}}>
        <SegmentedButtons 
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: 'cashier', label: 'Mode Kasir', icon: 'cart' },
            { value: 'check', label: 'Cek Stok/Harga', icon: 'magnify' }
          ]}
          theme={{
            colors: {
              secondaryContainer: '#444',
              onSecondaryContainer: '#fff',
              onSurface: '#444',
              outline: '#444',
            }
          }}
        />
      </View>
      
      <View style={styles.cameraWrapper}>
        {cameraActive ? (
        <CameraView 
          onBarcodeScanned={scanned ? undefined : handleScan} 
          style={StyleSheet.absoluteFillObject} 
        />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, {backgroundColor: '#000' }]}/>
        )}

        {loading && <ActivityIndicator animating={true} color="#fff" style={styles.loader} />}
      </View>

      <Portal>
        <Modal 
          visible={showCheckModal} 
          onDismiss={closeCheckModal} 
          contentContainerStyle={styles.modalContent}
        >
        {tempProduct && (
          <View>
            <Text 
              variant="titleLarge" 
              style={{ color: '#6200ee', fontWeight: 'bold' }}
            >
              {tempProduct.name}
            </Text>

            <Divider style={{ marginVertical: 10 }}/>

            <Text variant="bodyLarge" style={{ color: '#555'}}>
              Harga Jual: <Text style={{ fontWeight: 'bold', color: '#555'}}>
                Rp {tempProduct.price_sell?.toLocaleString('id-ID')}
              </Text>   
            </Text>

            <Text variant="bodyLarge" style={{ color: '#555'}}>
              Stok Saat Ini: <Text style={{ fontWeight: 'bold', color: '#555' }}>
                {tempProduct.stock} pcs
              </Text>
            </Text>

            <Text 
              variant="bodySmall" 
              style={{ marginTop: 10, color: '#666' }}
            >
              Barcode: {tempProduct.barcode}
            </Text>

            <Button 
              mode="contained" 
              onPress={closeCheckModal} 
              style={{ marginTop: 20 }}
            >
              Tutup
            </Button>
          </View>
        )}
        </Modal>
      </Portal>

      <View style={styles.cartArea}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {cart.map((item) => (
            <List.Item
              key={item.barcode}
              title={item.name}
              titleStyle={{ color: '#333', fontWeight: 'bold' }}
              description={() => {
                const qty = item.qty || 0;
                const wholesaleQty = item.wholesale_qty || 0;

                if (
                  item.price_wholesale > 0 &&
                  wholesaleQty > 0 &&
                  qty >= wholesaleQty
                ) {
                  const packages = Math.floor(qty/wholesaleQty);
                  const units = qty % wholesaleQty;

                  return (
                    <Text style={{ color: '#2e7d32' }}>
                      {packages} Grosir + {units} Ecer {'\n'}
                      <Text style={{ color: '#555', fontWeight:'bold' }}>
                        Total: Rp {((packages * item.price_wholesale) + (units * item.price_sell)).toLocaleString('id-ID')}
                      </Text>
                    </Text>
                  )
                }
                
                return(
                  <Text style={{ color: `#555`}}>
                    Rp {item.price_sell?.toLocaleString('id-ID')} x {qty}
                  </Text>
                );
              }}
              right={() => (
                <View style={styles.rightControlWrapper}>
                  <Button 
                    compact 
                    mode="outlined" 
                    onPress={() => updateQty(item.barcode, -1)} 
                    style={styles.qtyButton}
                    textColor="#333"
                  >
                    -
                  </Button>

                  <TextInputRN
                    value={item.qty.toString()}
                    onChangeText={(t) => manualQty(item.barcode, t)}
                    keyboardType="numeric"
                    style={styles.inputQty}
                  />

                  <Button 
                    compact 
                    mode="outlined" 
                    onPress={() => updateQty(item.barcode, 1)} 
                    style={styles.qtyButton}
                    textColor="#333"
                  >
                    +
                  </Button>

                  <IconButton
                    icon="delete"
                    iconColor="red"
                    size={24}
                    onPress={() => removeFromCart(item.barcode)}
                  />
                </View>
              )}
            />
          ))}
        </ScrollView>
      </View>

      <Card style={styles.totalCard}>
        <Card.Content style={styles.totalContent}>
          <View>
            <Text variant="labelLarge" style={{ color: '#555'}}>Total:</Text>
            <Text variant="headlineSmall" style={styles.totalText}>Rp {totalPrice?.toLocaleString('id-ID')}</Text>
          </View>
          <Button 
            mode="contained" 
            icon="cash-register" 
            disabled={cart.length === 0 || loading} 
            onPress={handleCheckout} 
            buttonColor="#2e7d32"
            textColor='#fff'
          >
            BAYAR
          </Button>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
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
    color: '#6200ee' 
  },
  cameraWrapper: { 
    width: '90%', 
    height: 160, 
    alignSelf: 'center', 
    overflow: 'hidden', 
    borderRadius: 20, 
    borderWidth: 3, 
    borderColor: '#6200ee' 
  },
  loader: { 
    position: 'absolute', 
    top: '40%', 
    left: '45%' 
  },
  cartArea: { 
    flex: 1, 
    paddingHorizontal: 10,
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
    marginHorizontal: 3, 
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
  totalCard: { 
    backgroundColor: '#fff', 
    elevation: 10 
  },
  totalContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 15 
  },
  totalText: { 
    fontWeight: 'bold', 
    color: '#2e7d32' 
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    margin: 20,
    borderRadius: 15,
    elevation: 5
  }
});