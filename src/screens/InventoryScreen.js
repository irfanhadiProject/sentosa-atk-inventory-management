import { useIsFocused } from '@react-navigation/native';
import { CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, FAB, Modal, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { getProductByBarcode, saveProduct } from '../firebase/firebaseConfig';
import { sharedStyles } from '../styles/sharedStyles';


export default function InventoryScreen() {
  const isFocused = useIsFocused();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  
  const [form, setForm] = useState({
    barcode: '', 
    name: '', 
    price_buy: '', 
    price_sell: '',
    price_wholesale: '',
    wholesale_qty: '',
    stock: '', 
  });

  useEffect(() => {
    if (!isFocused) {
      setIsScanning(false);
    }
  }, [isFocused]);

  const showToast = (message) => {
    setSnackMsg(message);
    setSnackbarVisible(true);
  }

  const hideModal = () => {
    setVisible(false);
    setIsScanning(false);
    setForm({ 
      barcode: '', 
      name: '', 
      price_sell: '', 
      price_buy: '', 
      stock: '', 
    });
  }

  const fetchProduct = async (code) => {
    if (!code) return;

    setLoading(true);
    try {
      const data = await getProductByBarcode(code);
      if (data) {
        setForm({
          barcode: code.toString(),
          name: data.name || '',
          price_sell: data.price_sell?.toString() || '',
          price_buy: data.price_buy?.toString() || '',
          price_wholesale: data.price_wholesale?.toString() || '',
          wholesale_qty: data.wholesale_qty?.toString() || '',
          stock: data.stock?.toString() || '',
        });
      } else {
        setForm({ ...form, barcode: code.toString() });
        showToast("Barang Baru, Silakan lengkapi data.");
      }
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Gagal mengambil data");
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!form.barcode || !form.name) return Alert.alert("Error", "Barcode dan Nama wajib diisi!");
    
    setLoading(true);
    try {
      const productData = {
        name: form.name,
        price_buy: parseInt(form.price_buy) || 0,
        price_sell: parseInt(form.price_sell) || 0,
        price_wholesale: parseInt(form.price_wholesale) || 0,
        wholesale_qty: parseInt(form.wholesale_qty) || 0,
        stock: parseInt(form.stock) || 0,
      };

      await saveProduct(form.barcode, productData);
      
      showToast("Sukses, Data produk berhasil diperbarui!");
      hideModal()
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const inputTheme = {
    colors: {
      onSurfaceVariant: Colors.light.subtext,
      primary: Colors.light.primary,
    }
  };

  return (
    <SafeAreaView style={sharedStyles.container}>
      <Text variant="headlineSmall" style={sharedStyles.title}>
        Inventory Management
      </Text>
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card style={styles.cardInfo}>
          <Card.Content>
            <Text 
              variant="titleMedium"
              style={{ color: Colors.light.text, fontWeight: 'bold'}}
            >
              Kelola Stok & Harga
            </Text>

            <Text 
              variant="bodySmall"
              style={{ color: Colors.light.subtext, marginTop: 4}}
            >
              Klik tombol + di pojok kanan bawah untuk menambah barang baru atau mengedit data barang yang sudah ada.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal 
          visible={visible} 
          onDismiss={() => !loading && hideModal()} 
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Detail Produk</Text>
          <Divider style={{ marginBottom: 15 }} />

          {isScanning ? (
            <View style={styles.miniCameraWrapper}>
              <CameraView 
                onBarcodeScanned={({data}) => fetchProduct(data)} 
                style={StyleSheet.absoluteFillObject} 
              />
              <Button mode="contained" onPress={() => setIsScanning(false)} style={styles.btnCancelScan}>Batal Scan</Button>
            </View>
          ) : (
            <ScrollView>
              <View style={styles.barcodeRow}>
                <TextInput 
                  label="Barcode"
                  value={form.barcode} 
                  onChangeText={t => setForm({...form, barcode: t})} 
                  mode="outlined" 
                  style={[styles.input, { flex: 1}]}
                  textColor={Colors.light.text}
                  theme={inputTheme}
                />

                <Button 
                  icon="camera" 
                  mode="contained" 
                  onPress={() => setIsScanning(true)} 
                  style={styles.scanBtn}
                >
                  Scan
                </Button>
              </View>

              <TextInput 
                label="Nama Barang" 
                value={form.name} 
                onChangeText={t => setForm({...form, name: t})} mode="outlined" 
                style={styles.input} 
                textColor={Colors.light.text}
                theme={inputTheme}
              />
              
              <View style={styles.row}>
                <TextInput 
                  label="Harga Modal" 
                  value={form.price_buy} 
                  onChangeText={t => setForm({...form, price_buy: t})} 
                  mode="outlined" 
                  keyboardType="numeric" 
                  style={[styles.input, { width: '48%' }]} 
                  textColor={Colors.light.text}
                  theme={inputTheme}
                />

                <TextInput 
                  label="Harga Jual" 
                  value={form.price_sell} 
                  onChangeText={t => setForm({...form, price_sell: t})} 
                  mode="outlined" 
                  keyboardType="numeric" 
                  style={[styles.input, { width: '48%' }]} 
                  textColor={Colors.light.text}
                  theme={inputTheme}
                />
              </View>

              <TextInput 
                label="Stok" 
                value={form.stock} 
                onChangeText={t => setForm({...form, stock: t})} 
                mode="outlined" 
                keyboardType="numeric" 
                style={styles.input} 
                textColor={Colors.light.text}
                theme={inputTheme}
              />
              
              <Divider style={{ marginVertical: 10 }} />
              <Text 
                variant="bodySmall" 
                style={{ marginBottom: 5, color: Colors.light.subtext }}
              >
                Setelan Grosir (Opsional)
              </Text>

              <View style={styles.row}>
                <TextInput 
                  label="Harga Grosir" 
                  value={form.price_wholesale} 
                  onChangeText={t => setForm({...form, price_wholesale: t})} 
                  mode="outlined" 
                  keyboardType="numeric" 
                  style={[styles.input, { width: '48%' }]} 
                  textColor={Colors.light.text}
                  placeholder="Contoh: 150000"
                  theme={inputTheme}
                />

                <TextInput 
                  label="Isi per Grosir" 
                  value={form.wholesale_qty} 
                  onChangeText={t => setForm({...form, wholesale_qty: t})} 
                  mode="outlined" 
                  keyboardType="numeric" 
                  style={[styles.input, { width: '48%' }]} 
                  textColor={Colors.light.text}
                  placeholder="Contoh: 12"
                  theme={inputTheme}
                />
              </View>

              <View style={styles.buttonActionRow}>
                <Button 
                  mode="contained" 
                  onPress={handleSaveProduct} 
                  loading={loading} 
                  disabled={loading} 
                  style={{ flex: 1, marginRight: 5 }}
                  buttonColor={Colors.light.primary}
                  textColor={Colors.light.background}
                >
                  Simpan
                </Button>

                <Button 
                  mode="outlined"
                  onPress={() => setVisible(false)} 
                  disabled={loading} 
                  style={{ flex: 1}}
                  buttonColor={Colors.light.background}
                  textColor={Colors.light.primary}                  
                >
                  Tutup
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2500}
          action={{ 
            label: 'OK', 
            onPress: () => setSnackbarVisible(false) 
          }}
        >
          {snackMsg}
        </Snackbar>
      </Portal>

      <FAB 
        icon="plus" 
        style={styles.fab} 
        onPress={() => setVisible(true)} 
        label="Tambah/Edit" 
        color={Colors.light.surface}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardInfo: { 
    backgroundColor: '#fff', 
    elevation: 2 
  },
  modal: { 
    backgroundColor: 'white', 
    padding: 20, 
    margin: 15, 
    borderRadius: 12, 
    maxHeight: '80%' 
  },
  modalTitle: { 
    color: '#333',
    marginBottom: 10, 
    fontWeight: 'bold' 
  },
  input: { 
    marginBottom: 12,
    backgroundColor: '#fff' 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  barcodeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  scanBtn: { 
    marginLeft: 8, 
    height: 50, 
    justifyContent: 'center' 
  },
  miniCameraWrapper: { 
    height: 250, 
    overflow: 'hidden', 
    borderRadius: 10, 
    marginBottom: 15 
  },
  btnCancelScan: { 
    position: 'absolute', 
    bottom: 10, 
    alignSelf: 'center' 
  },
  buttonActionRow: { 
    flexDirection: 'row', 
    marginTop: 15 
  },
  fab: { 
    position: 'absolute', 
    margin: 16, 
    right: 0, 
    bottom: 0, 
    backgroundColor: '#03dac6',
  }
});