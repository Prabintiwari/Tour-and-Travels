const calculateDiscountAmount = (
  basePrice: number,
  discountRate?: number | null,
  discountAmount?: number | null
): number => {
  // Priority: Use discountRate to calculate amount, otherwise use discountAmount directly
  if (discountRate && discountRate > 0) {
    return (basePrice * discountRate) / 100;
  }

  if (discountAmount && discountAmount > 0) {
    return discountAmount;
  }

  return 0;
};

const calculateFinalPrice = (
  basePrice: number,
  discountAmount: number
): number => {
  return Math.max(0, basePrice - discountAmount);
};

export { calculateDiscountAmount, calculateFinalPrice };
