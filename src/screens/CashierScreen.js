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
import { Colors } from '../../constants/Colors';
import { useCart } from '../context/CartContext';
import { getProductByBarcode, updateProductStock } from '../firebase/firebaseConfig';
import { sharedStyles } from '../styles/sharedStyles';

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
        <Text style={{ color: Colors.light.text }}>Izin kamera diperlukan</Text>
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
    <SafeAreaView style={sharedStyles.container}>
      <Text variant="headlineSmall" style={sharedStyles.title}>Sentosa Kasir</Text>

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
              secondaryContainer: Colors.light.text,
              onSecondaryContainer: Colors.light.surface,
              onSurface: Colors.light.text,
              outline: Colors.light.border,
            }
          }}
        />
      </View>
      
      <View style={sharedStyles.cameraWrapper}>
        {cameraActive ? (
        <CameraView 
          onBarcodeScanned={scanned ? undefined : handleScan} 
          style={StyleSheet.absoluteFillObject} 
        />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, {backgroundColor: '#000' }]}/>
        )}

        {loading && <ActivityIndicator animating={true} color="#fff" style={sharedStyles.loader} />}
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
              style={{ 
                color: Colors.light.primary , 
                fontWeight: 'bold' 
              }}
            >
              {tempProduct.name}
            </Text>

            <Divider style={{ marginVertical: 10 }}/>

            <Text variant="bodyLarge" style={{ color: Colors.light.text }}>
              Harga Jual: <Text style={{ fontWeight: 'bold', color: Colors.light.text }}>
                Rp {tempProduct.price_sell?.toLocaleString('id-ID')}
              </Text>   
            </Text>

            <Text variant="bodyLarge" style={{ color: Colors.light.text }}>
              Stok Saat Ini: <Text style={{ fontWeight: 'bold', color: Colors.light.text  }}>
                {tempProduct.stock} pcs
              </Text>
            </Text>

            <Text 
              variant="bodySmall" 
              style={{ marginTop: 10, color: Colors.light.subtext  }}
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
              titleStyle={{ 
                color: Colors.light.text, 
                fontWeight: 'bold' 
              }}
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
                    <Text style={{ color: Colors.light.success }}>
                      {packages} Grosir + {units} Ecer {'\n'}
                      <Text style={{ color: Colors.light.subtext, fontWeight:'bold' }}>
                        Total: Rp {((packages * item.price_wholesale) + (units * item.price_sell)).toLocaleString('id-ID')}
                      </Text>
                    </Text>
                  )
                }
                
                return(
                  <Text style={{ color: Colors.light.subtext}}>
                    Rp {item.price_sell?.toLocaleString('id-ID')} x {qty}
                  </Text>
                );
              }}
              right={() => (
                <View style={sharedStyles.rightControlWrapper}>
                  <Button 
                    compact 
                    mode="outlined" 
                    onPress={() => updateQty(item.barcode, -1)} 
                    style={sharedStyles.qtyButton}
                    textColor={Colors.light.text}
                  >
                    -
                  </Button>

                  <TextInputRN
                    value={item.qty.toString()}
                    onChangeText={(t) => manualQty(item.barcode, t)}
                    keyboardType="numeric"
                    style={sharedStyles.inputQty}
                  />

                  <Button 
                    compact 
                    mode="outlined" 
                    onPress={() => updateQty(item.barcode, 1)} 
                    style={sharedStyles.qtyButton}
                    textColor={Colors.light.text}
                  >
                    +
                  </Button>

                  <IconButton
                    icon="delete"
                    iconColor={Colors.light.danger}
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
            <Text 
              variant="labelLarge" 
              style={{ color: Colors.light.subtext}}
            >
              Total:
            </Text>

            <Text 
              variant="headlineSmall" 
              style={{
                fontWeight: 'bold',
                color: Colors.light.success
              }}
            >
              Rp {totalPrice?.toLocaleString('id-ID')}
            </Text>
          </View>

          <Button 
            mode="contained" 
            icon="cash-register" 
            disabled={cart.length === 0 || loading} 
            onPress={handleCheckout} 
            buttonColor={Colors.light.success}
            textColor={Colors.light.surface}
          >
            BAYAR
          </Button>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cartArea: { 
    flex: 1, 
    paddingHorizontal: 10,
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
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    margin: 20,
    borderRadius: 15,
    elevation: 5
  }
});