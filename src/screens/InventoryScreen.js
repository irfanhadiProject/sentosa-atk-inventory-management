import { useIsFocused } from '@react-navigation/native';
import { CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, FAB, Snackbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import SearchProduct from '../components/SearchProduct';
import { generateSKU, getProductByBarcode, getZakatReport, saveProduct, syncInitialAssetValue } from '../firebase/firebaseConfig';
import { sharedStyles } from '../styles/sharedStyles';

const GOLD_PRICES_PER_GRAM = 3135000;
const ANNUAL_NISAB = 85 * GOLD_PRICES_PER_GRAM;

export default function InventoryScreen() {
  const isFocused = useIsFocused();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [globalAsset, setGlobalAsset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [zakatAmount, setZakatAmount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const isReachedNisab = globalAsset >= ANNUAL_NISAB;
  
  const [form, setForm] = useState({
    barcode: '', 
    name: '', 
    category: '',
    brand: '',
    sku: '',
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

  useEffect(() => {
    const fetchInitialReport = async () => {
      const report = await getZakatReport();
      setGlobalAsset(report.totalAsset);
      setZakatAmount(report.zakatAmount);
    };
    if (isFocused) fetchInitialReport();
  }, [isFocused]);

  useEffect(() => {
    let isMounted = true;

    const updateSku = async () => {
      const category = form?.category?.trim() || "";
      const brand = form?.brand?.trim() || "";

      if (category.length >= 3 && brand.length >= 3 && !form.sku) {
        try {
          const newSku = await generateSKU(category, brand, form.barcode);
          if (isMounted) {
            setForm(prev => ({ ...prev, sku: newSku}));
          }
        } catch (error) {
          console.error("Gagal generate SKU:", error);
        }
      }
    }

    updateSku();
    return () => { isMounted = false; };
  }, [form.category, form.brand, form.sku, form.barcode]);

  const showToast = (message) => {
    setSnackMsg(message);
    setSnackbarVisible(true);
  }

  const hideForm = () => {
    setIsFormVisible(false);
    setIsScanning(false);
    setForm({ 
      barcode: '', 
      name: '',
      category: '',
      brand: '',
      sku: '',
      price_buy: '', 
      price_sell: '',
      price_wholesale: '',
      wholesale_qty: '',
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
          category: data.category || '',
          brand: data.brand || '',
          sku: data.sku || '',
          price_buy: data.price_buy?.toString() || '',
          price_sell: data.price_sell?.toString() || '',
          price_wholesale: data.price_wholesale?.toString() || '',
          wholesale_qty: data.wholesale_qty?.toString() || '',
          stock: data.stock?.toString() || '',
        });
      } else {
        setForm({ 
          barcode: code.toString() ,
          name: '',
          category: '',
          brand: '',
          sku: '',
          price_buy: '',
          price_sell: '',
          price_wholesale: '',
          wholesale_qty: '',
          stock: ''
        });
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
    const finalBarcode = form.barcode.trim() || form.sku;

    if (!finalBarcode || !form.name) return Alert.alert("Error", "Barcode/SKU dan Nama wajib diisi!");
    
    setLoading(true);
    try {
      const productData = {
        name: form.name,
        category: form.category,
        brand: form.brand,
        sku: form.sku,
        price_buy: parseInt(form.price_buy) || 0,
        price_sell: parseInt(form.price_sell) || 0,
        price_wholesale: parseInt(form.price_wholesale) || 0,
        wholesale_qty: parseInt(form.wholesale_qty) || 0,
        stock: parseInt(form.stock) || 0,
      };

      await saveProduct(finalBarcode, productData);

      const report = await getZakatReport();
      setGlobalAsset(report.totalAsset);
      setZakatAmount(report.zakatAmount);

      showToast("Sukses, Data produk berhasil diperbarui!");
      hideForm()
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => {
      const newData = { ...prev, [field]: value};

      if (field === "category" || field === "brand") {
        newData.sku = "";
      }

      return newData
    });
  };

  const inputTheme = {
    colors: {
      onSurfaceVariant: Colors.light.subtext,
      primary: Colors.light.primary,
    }
  };

  const handleSyncAset = async () => {
    Alert.alert(
      "Sinkronisasi Total Aset",
      "Ini akan menghitung ulang seluruh nilai stok dari database. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Sinkronkan", 
          onPress: async () => {
            setIsSyncing(true);
            try {
              await syncInitialAssetValue();
              const report = await getZakatReport();
              setGlobalAsset(report.totalAsset);
              setZakatAmount(report.zakatAmount);
              showToast("Sinkronisasi Berhasil!");
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Gagal sinkronisasi");
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  if (isFormVisible) {
    return (
      <SafeAreaView style={sharedStyles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding': 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEnabled={!isSearching}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="titleLarge" style={styles.formTitle}>Detail Produk</Text>
            <Divider style={{ marginBottom: 15 }} />
  
            {isScanning && isFocused && (
              <View style={styles.miniCameraWrapper}>
                <CameraView 
                  key="inventory-camera-resource"
                  onBarcodeScanned={
                    loading 
                    ? undefined
                    : ({data}) => fetchProduct(data)
                  } 
                  style={StyleSheet.absoluteFillObject} 
                />
  
                {loading && (
                  <View style={[StyleSheet.absoluteFillObject, sharedStyles.cameraLoadingOverlay]}>
                    <ActivityIndicator animating={true} color={Colors.light.primary} size="large" />
                    <Text style={sharedStyles.loadingText}>Mengambil Data...</Text>
                  </View>
                )}
  
                <Button 
                  mode="contained" 
                  onPress={() => setIsScanning(false)} 
                  style={styles.btnCancelScan}
                  textColor={Colors.light.background}
                >
                  Batal Scan
                </Button>
              </View>
            )}

            <SearchProduct
              placeholder="Cari produk jika barcode tidak terbaca..."
              onSelect={(item) => {
                setForm({
                  barcode: item.id,
                  name: item.name || '',
                  category: item.category || '',
                  brand: item.brand || '',
                  sku: item.sku || '',
                  price_buy: item.price_buy?.toString() || '',
                  price_sell: item.price_sell?.toString() || '',
                  price_wholesale: item.price_wholesale?.toString() || '',
                  wholesale_qty: item.wholesale_qty?.toString() || '',
                  stock: item.stock?.toString() || '',
                });

                setIsScanning(false);
              }}
              onFocus={() => {
                setIsScanning(false);
                setIsSearching(true);
              }}
              onBlur={() => setIsSearching(false)}
            />

            <View>
              <View style={styles.barcodeRow}>
                <TextInput 
                  label="Barcode"
                  value={form.barcode} 
                  onChangeText={t => handleInputChange('barcode', t)} 
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
                  textColor={Colors.light.background}
                >
                  Scan
                </Button>
              </View>
  
              <TextInput 
                label="Nama Barang" 
                value={form.name} 
                onChangeText={t => handleInputChange('name', t)} 
                mode="outlined" 
                style={styles.input} 
                textColor={Colors.light.text}
                theme={inputTheme}
              />
  
              <View style={styles.row}>
                <TextInput 
                  label="Kategori" 
                  value={form.category} 
                  onChangeText={t => handleInputChange('category', t)} mode="outlined" 
                  style={[styles.input, { width: '48%' }]}
                  textColor={Colors.light.text}
                  theme={inputTheme}
                />
  
                <TextInput 
                  label="Merk" 
                  value={form.brand} 
                  onChangeText={t => handleInputChange('brand', t)} mode="outlined" 
                  style={[styles.input, { width: '48%' }]} 
                  textColor={Colors.light.text}
                  theme={inputTheme}
                />
              </View>
  
              <View 
                style={[
                  styles.cardBase, 
                  {
                    padding: 10, 
                    backgroundColor: Colors.light.background, 
                    marginBottom: 15
                  }
                ]}
              >
                <Text variant="labelSmall">
                  SKU INTERNAL (Otomatis):
                </Text>
                
                <Text variant="titleMedium" style={{fontWeight: 'bold'}}>
                  {form.sku || 'Akan terisi otomatis...'}
                </Text>
              </View>
              
              <View style={styles.row}>
                <TextInput 
                  label="Harga Modal" 
                  value={form.price_buy} 
                  onChangeText={t => handleInputChange('price_buy', t)} 
                  mode="outlined" 
                  keyboardType="numeric" 
                  style={[styles.input, { width: '48%' }]} 
                  textColor={Colors.light.text}
                  theme={inputTheme}
                />
  
                <TextInput 
                  label="Harga Jual" 
                  value={form.price_sell} 
                  onChangeText={t => handleInputChange('price_sell', t)} 
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
                onChangeText={t => handleInputChange('stock', t)} 
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
                  onChangeText={t => handleInputChange('price_wholesale', t)}  
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
                  onChangeText={t => handleInputChange('wholesale_qty', t)}  
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
                  onPress={hideForm} 
                  disabled={loading} 
                  style={{ flex: 1}}
                  buttonColor={Colors.light.background}
                  textColor={Colors.light.primary}                  
                >
                  Tutup
                </Button>
              </View>
            </View>
          
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.container}>
      <Text variant="headlineSmall" style={sharedStyles.title}>
        Inventory Management
      </Text>
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card style={[styles.cardBase, { backgroundColor: Colors.light.infoCard }]}>
          <Card.Content>
            <View style={styles.flexRowBetween}>
              <View style={{ flex: 1 }}>
                <Text variant="labelMedium" style={{ color: Colors.light.subtext }}>
                  Total Nilai Aset (Harga Jual)
                </Text>
                <Text variant="headlineSmall" style={{ color: Colors.light.primary, fontWeight: 'bold' }}>
                  Rp {globalAsset.toLocaleString()}
                </Text>
              </View>
              <Button 
                icon="sync" 
                mode="text" 
                onPress={handleSyncAset}
                loading={isSyncing}
                disabled={isSyncing}
                textColor={Colors.light.primary}
              >
                Sync
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={[
          styles.cardBase, 
          { 
            backgroundColor: isReachedNisab ? Colors.light.successLight : Colors.light.warningLight,
            borderLeftWidth: 5,
            borderLeftColor: isReachedNisab ? Colors.light.success : Colors.light.warning,
          }
        ]}>
          <Card.Content>
            <View style={styles.flexRow}>
              <View style={styles.zakatIconWrapper}>
                <Text style={{ fontSize: 24 }}>{isReachedNisab ? '✅' : '⏳'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text variant="labelMedium" style={{ color: Colors.light.subtext }}>
                  Status Zakat Perniagaan
                </Text>
                
                <Text variant="titleMedium" style={{ 
                  color: isReachedNisab ? Colors.light.success : Colors.light.warning, 
                  fontWeight: 'bold' 
                }}>
                  {isReachedNisab ? 'Sudah Mencapai Nisab' : 'Belum Mencapai Nisab'}
                </Text>

                {isReachedNisab ? (
                  <View>
                    <Text variant="headlineSmall" style={{ color: Colors.light.success, fontWeight: 'bold' }}>
                      Rp {zakatAmount.toLocaleString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: Colors.light.subtext }}>
                      Wajib dikeluarkan jika sudah berlalu 1 tahun (Haul).
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text variant="bodySmall" style={{ color: Colors.light.text }}>
                      Nisab: Rp {ANNUAL_NISAB.toLocaleString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: Colors.light.danger }}>
                      Kurang: Rp {(ANNUAL_NISAB - globalAsset).toLocaleString()} lagi.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.cardBase}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: Colors.light.text, fontWeight: 'bold'}}>
              Kelola Stok & Harga
            </Text>
            <Text variant="bodySmall" style={{ color: Colors.light.subtext, marginTop: 4}}>
              Klik tombol + di pojok kanan bawah untuk menambah barang baru atau mengedit data barang yang sudah ada.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

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

      <FAB 
        icon="plus" 
        style={styles.fab} 
        onPress={() => setIsFormVisible(true)} 
        label="Tambah/Edit" 
        color={Colors.light.surface}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardBase: { 
    backgroundColor: Colors.light.surface, 
    elevation: 2,
    marginBottom: 15,
    borderRadius: 12,
  },
  flexRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  flexRowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  zakatIconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.surface,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2
  },
  formTitle: { 
    color: Colors.light.text,
    marginBottom: 10, 
    fontWeight: 'bold' 
  },
  input: { 
    marginBottom: 12,
    backgroundColor: Colors.light.surface 
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
    justifyContent: 'center',
    backgroundColor: Colors.light.primary
  },
  miniCameraWrapper: { 
    height: 250, 
    overflow: 'hidden', 
    borderRadius: 10, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.light.border
  },
  btnCancelScan: { 
    position: 'absolute', 
    bottom: 10, 
    alignSelf: 'center',
    backgroundColor: Colors.light.danger
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
    backgroundColor: Colors.light.secondary,
  }
});