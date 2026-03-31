import { useEffect, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { ActivityIndicator, List, Text } from "react-native-paper";
import { Colors } from "../../constants/Colors";
import { searchProductsByName } from "../firebase/firebaseConfig";

export default function SearchProduct({ onSelect, placeholder, onFocus, onBlur }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // debounce input
  useEffect(() => {
    if(!query.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);

        const result = await searchProductsByName(
          query.toLowerCase()
        );

        setResults(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 400)

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
      <TextInput
        placeholder={placeholder || "Cari nama barang..."}
        placeholderTextColor={Colors.light.subtext}
        value={query}
        onChangeText={setQuery}
        onFocus={() => {
          if (onFocus) onFocus();
        }}
        onBlur={() => {
          if (onBlur) onBlur();
        }}      
        style={styles.input}
      />

      {query.length > 0 && (
        <View style={styles.overlay}>
          <ScrollView keyboardShouldPersistTaps="handled">

            {loading && <ActivityIndicator />}

            {!loading && results.length === 0 && (
              <Text style={{ textAlign: 'center', color: Colors.light.text}}>
                Barang tidak ditemukan
              </Text>
            )}

            {results.map(item => (
              <List.Item
                key={item.id}
                title={item.name}
                titleStyle={{ color: Colors.light.text }}
                description={
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <Text style={{ color: Colors.light.success, fontWeight: 'bold', marginRight: 10 }}>
                      Rp {item.price_sell.toLocaleString()}
                    </Text>
                    <Text style={{ color: Colors.light.subtext }}>
                      Stok: {item.stock}
                    </Text>
                  </View>
                }
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                  setResults([]);
                  if (onBlur) onBlur();
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = {
  input: {
    backgroundColor: Colors.light.surface,
    padding: 10,
    marginBottom: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  overlay: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    elevation: 10,
    maxHeight: 250,
    zIndex: 999,
  }
};