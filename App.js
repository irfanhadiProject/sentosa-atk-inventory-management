import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens & Context
import { CartProvider } from './src/context/CartContext';
import CashierScreen from './src/screens/CashierScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import RestockScreen from './src/screens/RestockScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <CartProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                  let iconName;
                  if (route.name === 'Kasir') iconName = 'cash-register';
                  else if (route.name === 'Restock') iconName = 'database-import';
                  else if (route.name === 'Produk') iconName = 'archive-settings';
                  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
              })}
            >
              <Tab.Screen name="Kasir" component={CashierScreen} />
              <Tab.Screen name="Restock" component={RestockScreen} />
              <Tab.Screen name="Produk" component={InventoryScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </CartProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}