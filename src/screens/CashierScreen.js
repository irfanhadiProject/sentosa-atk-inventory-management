import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
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
  Snackbar,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import SearchProduct from '../components/SearchProduct';
import { useCart } from '../context/CartContext';
import { getProductByBarcode, updateProductStock } from '../firebase/firebaseConfig';
import { sharedStyles } from '../styles/sharedStyles';

export default function CashierScreen() {
  const isFocused = useIsFocused();

  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('cashier');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [tempProduct, setTempProduct] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const stateRef = useRef("IDLE");
  const lastScannedRef = useRef(null);
  const cooldownRef = useRef(null);

  const { cart, addToCart, updateQty, manualQty, removeFromCart, clearCart, totalPrice } = useCart();

  // Activate or deactivate camera based on focused state
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

  // Camera permission button
  if (!permission?.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text 
          style={{ 
            color: Colors.light.text, 
            marginBottom: 
            20, fontSize: 18 
          }}
        >
          Izin kamera diperlukan
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
    setSnackbarVisible(false);

    requestAnimationFrame(() => {
      setSnackMsg(message);
      setSnackbarVisible(true);
    });
  };

  const handleSelectProduct = (product, barcodeOrSku) => {
    if (mode === 'cashier') {
      addToCart({ 
        barcode: barcodeOrSku,
        name: product.name, 
        price_sell: product.price_sell,
        price_wholesale: product.price_wholesale,
        wholesale_qty: product.wholesale_qty
      });
    } else {
      setTempProduct({ 
        ...product, 
        barcode: barcodeOrSku,
        price_sell: product.price_sell || 0,
        stock: product.stock || 0
      });
      setShowCheckModal(true);
      stateRef.current = "BLOCKED_BY_MODAL";
    }
  };

  // Scan barcode function
  const handleScan = async ({ data }) => {
    // Prevent scanning item while loading, already scanning, or scanning the same item
    if (stateRef.current !== "IDLE") return;
    if (lastScannedRef.current === data) return;

    let outcome = "UNKNOWN";
    stateRef.current = "PROCESSING";
    lastScannedRef.current = data;

    setLoading(true);

    try {
      const result = await getProductByBarcode(data);

      if (!result) {
        showToast("Barang tidak ditemukan!");
        outcome = "NOT_FOUND";
      } else {
        // Check item mode, show modal window
        handleSelectProduct(result, data);

        outcome = mode === 'cashier'
          ? "SUCCESS_CASHIER"
          : "SUCCESS_CHECK";
      }
     
    } catch (e) {
      console.error(e);
      showToast("Gagal ambil data.");
      outcome = "ERROR";
    } finally {
      // Reset loading, scanned, lastScanned state
      setLoading(false);
      
      switch (outcome) {
        case "SUCCESS_CASHIER":
          stateRef.current = "COOLDOWN";
    
          if (cooldownRef.current) {
            clearTimeout(cooldownRef.current);
          }
    
          cooldownRef.current = setTimeout(() => {
            stateRef.current = "IDLE";
            lastScannedRef.current = null;
          }, 1000);
          break;
    
        case "SUCCESS_CHECK":
          stateRef.current = "BLOCKED_BY_MODAL";
          break;
    
        case "NOT_FOUND":
        case "ERROR":
        default:
          stateRef.current = "IDLE";

          setTimeout(() => {
            lastScannedRef.current = null;
          }, 2000);
          break;
      }
    }
  };

  // Function to reset modal state
  const closeCheckModal = () => {
    setShowCheckModal(false);
    setTempProduct(null);
    
    stateRef.current = "IDLE";
    lastScannedRef.current = null;
  };

  // Checkout function
  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      await Promise.all(
        cart.map(item => updateProductStock(item.barcode, item.qty))
      );
      showToast("Transaksi Berhasil!");
      clearCart();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal update stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1}}>
      <SafeAreaView style={sharedStyles.container}>
        <Pressable onPress={Keyboard.dismiss}>
          <Text variant="headlineSmall" style={sharedStyles.title}>Sentosa Kasir</Text>
        </Pressable>

        <View style={styles.segmentedWrapper}>
          <SegmentedButtons 
            value={mode}
            onValueChange={(val) => {
              setCameraActive(false);
              setMode(val);
              setTimeout(() => setCameraActive(true), 150);
            }}
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
  
          <SearchProduct
            placeholder="Cari nama barang..."
            onSelect={(item) => {
              handleSelectProduct(item, item.id);
            }}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
          />
        </View>
        
        <View style={sharedStyles.cameraWrapper}>
          {cameraActive && isFocused ? (
            <CameraView 
              key={`camera-${mode}-${isFocused}`}
              onBarcodeScanned={handleScan} 
              style={StyleSheet.absoluteFillObject} 
              facing="back"
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
          <ScrollView 
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          >
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