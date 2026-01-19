import {
  DiscountSource,
  DiscountValueType,
  PricingConfigType,
  TourType,
} from "@prisma/client";
import prisma from "../../config/prisma";

const calculateDriverPricing = async (
  tourType: TourType | undefined,
  durationDays: number,
  numberOfDrivers: number,
) => {
  let baseRate = 1000;
  let distanceCharge = 0;
  let terrainCharge = 0;

  if (tourType) {
    const driverConfig = await prisma.pricingConfig.findFirst({
      where: {
        type: PricingConfigType.DRIVER,
        tourType,
        isActive: true,
      },
    });

    if (driverConfig) {
      baseRate = driverConfig.baseDriverRate ?? baseRate;

      // Apply terrain multiplier
      if (driverConfig.terrainMultiplier) {
        terrainCharge =
          baseRate *
          (driverConfig.terrainMultiplier - 1) *
          durationDays *
          numberOfDrivers;
      }
    }
  }

  const total =
    baseRate * durationDays * numberOfDrivers + distanceCharge + terrainCharge;

  return {
    baseRate,
    distanceCharge,
    terrainCharge,
    total,
  };
};

const calculateDiscounts = async (
  grossAmount: number,
  durationDays: number,
  couponCode: string | undefined,
  userId: string,
  vehicleType: any,
) => {
  const discounts: any[] = [];
  let totalDiscount = 0;

  // Apply coupon discount
  if (couponCode) {
    const coupon = await prisma.pricingConfig.findFirst({
      where: {
        code: couponCode,
        type: PricingConfigType.DISCOUNT,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: { gte: new Date() } }, { validUntil: null }],
      },
    });

    if (coupon && coupon.discountValue) {
      // Check usage limit
      if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
        // Check minimum booking amount
        if (
          !coupon.minBookingAmount ||
          grossAmount >= coupon.minBookingAmount
        ) {
          // Check minimum days
          if (!coupon.minDays || durationDays >= coupon.minDays) {
            let discountAmount = 0;

            if (coupon.discountValueType === DiscountValueType.PERCENTAGE) {
              discountAmount = (grossAmount * coupon.discountValue) / 100;

              // Apply max discount cap
              if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
              }
            } else if (coupon.discountValueType === DiscountValueType.FIXED) {
              discountAmount = coupon.discountValue;
            }

            if (discountAmount > 0) {
              discounts.push({
                source: DiscountSource.COUPON,
                valueType: coupon.discountValueType,
                value: coupon.discountValue,
                amount: discountAmount,
                code: couponCode,
              });
              totalDiscount += discountAmount;
            }
          }
        }
      }
    }
  }

  // Apply long-term rental discount
  if (durationDays >= 7) {
    const longTermConfig = await prisma.pricingConfig.findFirst({
      where: {
        type: "DISCOUNT",
        discountSource: DiscountSource.LONG_TERM,
        minDays: { lte: durationDays },
        isActive: true,
      },
      orderBy: {
        minDays: "desc",
      },
    });

    if (longTermConfig && longTermConfig.discountValue) {
      let discountAmount = 0;

      if (longTermConfig.discountValueType === DiscountValueType.PERCENTAGE) {
        discountAmount = (grossAmount * longTermConfig.discountValue) / 100;
      } else {
        discountAmount = longTermConfig.discountValue;
      }

      if (discountAmount > 0) {
        discounts.push({
          source: DiscountSource.LONG_TERM,
          valueType: longTermConfig.discountValueType,
          value: longTermConfig.discountValue,
          amount: discountAmount,
        });
        totalDiscount += discountAmount;
      }
    }
  }

  return {
    discounts,
    totalDiscount,
  };
};

const calculateRefund = async (booking: any) => {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const daysUntilStart = Math.ceil(
    (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  let refundPercentage = 0;

  // Cancellation policy
  if (daysUntilStart >= 7) {
    refundPercentage = 90; // 90% refund
  } else if (daysUntilStart >= 3) {
    refundPercentage = 50; // 50% refund
  } else if (daysUntilStart >= 1) {
    refundPercentage = 25; // 25% refund
  } else {
    refundPercentage = 0; // No refund
  }

  return (booking.totalPrice * refundPercentage) / 100;
};

export { calculateDriverPricing, calculateDiscounts, calculateRefund };
