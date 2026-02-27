import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const existingItemIndex = cart.findIndex(item => item.barcode === product.barcode);
    if (existingItemIndex > -1) {
      let newCart = [...cart];
      newCart[existingItemIndex].qty += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (barcode, amount) => {
    setCart(prev => prev.map(item => 
      item.barcode === barcode 
        ? { ...item, qty: Math.max(1, item.qty + amount) } 
        : item
    ));
  };

  const manualQty = (barcode, value) => {
    const cleanNumber = value.replace(/[^0-9]/g, '');
    setCart(prev => prev.map(item => 
      item.barcode === barcode 
        ? { ...item, qty: cleanNumber === '' ? 0 : parseInt(cleanNumber) } 
        : item
    ));
  };

  const removeFromCart = (barcode) => {
    setCart(prev => prev.filter(item => item.barcode !== barcode));
  };

  const clearCart = () => setCart([]);

  const totalPrice = cart.reduce((sum, item) => {
    const qty = item.qty || 0;
    const sellPrice = item.price_sell || 0;
    const wholesalePrice = item.price_wholesale || 0;
    const wholesaleQty = item.wholesale_qty || 0;

    let itemTotal = 0;

    if (
      wholesalePrice > 0 &&
      wholesaleQty > 0 &&
      qty >= wholesaleQty
    ) {
      const numWholesalePackages = Math.floor(qty / wholesaleQty);
      const remainingUnits = qty % wholesaleQty;

      itemTotal = (numWholesalePackages * wholesalePrice) + (remainingUnits * sellPrice);
    } else {
      itemTotal = qty * sellPrice;
    }

    return sum + itemTotal;
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQty, 
      manualQty, 
      removeFromCart, 
      clearCart,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);