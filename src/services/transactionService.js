import { executeBatchCheckout } from "../firebase/repositories/transactionRepository"

export const processCheckout = async (cartItems) => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Keranjang Kosong")
  }

  await executeBatchCheckout(cartItems)
}