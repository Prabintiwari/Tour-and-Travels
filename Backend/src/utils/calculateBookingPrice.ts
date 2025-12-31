export const calculateBookingPrice = (
  pricePerParticipant: number,
  numberOfParticipants: number,
  discountRate: number = 0,
  needsGuide: boolean = false,
  guidePricePerParticipant: number = 0
) => {
  const basePrice = pricePerParticipant * numberOfParticipants;
  const discountPrice = (basePrice * discountRate) / 100;
  const totalPrice = basePrice - discountPrice;
  
  let guideTotalPrice = 0;
  if (needsGuide) {
    guideTotalPrice = guidePricePerParticipant * numberOfParticipants;
  }
  
  return {
    totalPrice: totalPrice + guideTotalPrice,
    discountPrice,
    guideTotalPrice: needsGuide ? guideTotalPrice : null,
  };
};