import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
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
  const [tempProduct, setTempProduct] = useState(null);
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
        <Text style={{ color: Colors.light.text, marginBottom: 20, fontSize: 18 }}>Izin kamera diperlukan</Text>
        <Button mode="contained" onPress={requestPermission} buttonColor={Colors.light.primary} textColor={Colors.light.background}>
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
        if (mode === 'cashier') {
          addToCart({ 
            barcode: data, 
            name: result.name, 
            price_sell: result.price_sell,
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
          setShowCheckModal(true);
        }
      } else {
        Alert.alert("Error", "Barang tidak ditemukan!");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal ambil data.");
    } finally {
      setLoading(false);
      if (mode === 'cashier') {
        setTimeout(() => setScanned(false), 1200);
      }
    }
  };

  const closeCheckModal = () => {
    setShowCheckModal(false);
    setTempProduct(null);
    setScanned(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await Promise.all(cart.map(item => updateProductStock(item.barcode, item.qty)));
      Alert.alert("Sukses", "Transaksi Berhasil!");
      clearCart();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal update stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={sharedStyles.container}>
      <Text variant="headlineSmall" style={sharedStyles.title}>Sentosa Kasir</Text>

      <View style={styles.segmentedWrapper}>
        <SegmentedButtons 
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: 'cashier', label: 'Mode Kasir', icon: 'cart' },
            { value: 'check', label: 'Cek Stok/Harga', icon: 'magnify' }
          ]}
          theme={{
            colors: {
              secondaryContainer: Colors.light.primary,
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
            onBarcodeScanned={(scanned || loading) ? undefined : handleScan} 
            style={StyleSheet.absoluteFillObject} 
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}/>
        )}

        {loading && (
          <View style={[StyleSheet.absoluteFillObject, sharedStyles.cameraLoadingOverlay]}>
            <ActivityIndicator animating={true} color={Colors.light.primary} size="large" />
            <Text style={sharedStyles.loadingText}>Mengambil Data...</Text>
          </View>
        )}
      </View>

      <Portal>
        <Modal 
          visible={showCheckModal} 
          onDismiss={closeCheckModal} 
          contentContainerStyle={styles.modalContent}
        >
          {tempProduct && (
            <View>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {tempProduct.name}
              </Text>
              <Divider style={styles.divider} />
              <Text variant="bodyLarge" style={styles.infoText}>
                Harga Jual: <Text style={styles.boldText}>Rp {tempProduct.price_sell?.toLocaleString('id-ID')}</Text>   
              </Text>
              <Text variant="bodyLarge" style={styles.infoText}>
                Stok Saat Ini: <Text style={styles.boldText}>{tempProduct.stock} pcs</Text>
              </Text>
              <Text variant="bodySmall" style={styles.barcodeText}>
                Barcode: {tempProduct.barcode}
              </Text>
              <Button 
                mode="contained" 
                onPress={closeCheckModal} 
                style={{ marginTop: 20 }}
                buttonColor={Colors.light.primary}
                textColor={Colors.light.background}
              >
                Tutup
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      <View style={styles.cartArea}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {cart.map((item) => (
            <List.Item
              key={item.barcode}
              title={item.name}
              titleStyle={styles.cartTitle}
              description={() => {
                const qty = item.qty || 0;
                const wholesaleQty = item.wholesale_qty || 0;

                if (item.price_wholesale > 0 && wholesaleQty > 0 && qty >= wholesaleQty) {
                  const packages = Math.floor(qty/wholesaleQty);
                  const units = qty % wholesaleQty;
                  return (
                    <Text style={{ color: Colors.light.success }}>
                      {packages} Grosir + {units} Ecer {'\n'}
                      <Text style={{ color: Colors.light.subtext, fontWeight:'bold' }}>
                        Total: Rp {((packages * item.price_wholesale) + (units * item.price_sell)).toLocaleString('id-ID')}
                      </Text>
                    </Text>
                  );
                }
                return(
                  <Text style={{ color: Colors.light.subtext }}>
                    Rp {item.price_sell?.toLocaleString('id-ID')} x {qty}
                  </Text>
                );
              }}
              right={() => (
                <View style={sharedStyles.rightControlWrapper}>
                  <Button 
                    compact mode="outlined" 
                    onPress={() => updateQty(item.barcode, -1)} 
                    style={sharedStyles.qtyButton}
                    textColor={Colors.light.text}
                    contentStyle={{ width: 35, height: 35 }}
                  > - </Button>
                  <TextInputRN
                    value={item.qty.toString()}
                    onChangeText={(t) => manualQty(item.barcode, t)}
                    keyboardType="numeric"
                    style={sharedStyles.inputQty}
                  />
                  <Button 
                    compact mode="outlined" 
                    onPress={() => updateQty(item.barcode, 1)} 
                    style={sharedStyles.qtyButton}
                    textColor={Colors.light.text}
                    contentStyle={{ width: 35, height: 35 }}
                  > + </Button>
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
            <Text variant="labelLarge" style={{ color: Colors.light.subtext }}>Total:</Text>
            <Text variant="headlineSmall" style={styles.totalAmount}>
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
            contentStyle={{ height: 50 }}
          >
            BAYAR
          </Button>
        </Card.Content>
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
  segmentedWrapper: { 
    paddingHorizontal: 20, 
    marginBottom: 15
  },
  cartArea: { 
    flex: 1, 
    paddingHorizontal: 10,
  },
  cartTitle: { 
    color: Colors.light.text, 
    fontWeight: 'bold' 
  },
  totalCard: { 
    backgroundColor: Colors.light.surface, 
    elevation: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  totalContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10
  },
  totalAmount: {
    fontWeight: 'bold',
    color: Colors.light.success
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    padding: 25,
    margin: 20,
    borderRadius: 15,
    elevation: 5
  },
  modalTitle: { 
    color: Colors.light.primary, 
    fontWeight: 'bold' 
  },
  divider: { 
    marginVertical: 10 
  },
  infoText: { 
    color: Colors.light.text,
    marginBottom: 5 
  },
  boldText: { 
    fontWeight: 'bold', 
    color: Colors.light.text 
  },
  barcodeText: { 
    marginTop: 10, 
    color: Colors.light.subtext 
  }
});