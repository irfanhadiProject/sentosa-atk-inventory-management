/**
 * Evaluates whether a product's stock has dropped to or below its minimum threshold.
 * This directly implement the dynamic verification and fallback strategy from inventory BR-01.
 * 
 * @param {Object} product - The product object from Firestore.
 * @param {number} product.stock - The current physical stock count of the item.
 * @param {number} [product.minStock] - The individual minimun stock safety threshold.
 * @returns {boolean} True if the product's stock matches the low stock condition
 */ 
export const isStockLow = (product) => {
  if (!product) return false;

  // BR-01 Fallback: Use individual minStock if defined, otherwise default to 5
  const resolvedThreshold = 
    product.minStock !== undefined && product.minStock !== null
      ? product.minStock
      : 5;

  return product.stock <= resolvedThreshold
}