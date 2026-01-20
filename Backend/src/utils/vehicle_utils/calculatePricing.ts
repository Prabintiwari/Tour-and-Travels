import {
  DiscountSource,
  DiscountValueType,
  PricingConfigType,
  RentalStatus,
  TourType,
} from "@prisma/client";
import prisma from "../../config/prisma";

const getSeasonalMultiplier = async (
  startDate: Date,
  endDate: Date,
  vehicleType: any,
  region: string,
) => {
  const seasonalConfigs = await prisma.pricingConfig.findMany({
    where: {
      type: PricingConfigType.SEASONAL,
      isActive: true,
      validFrom: { lte: endDate },
      validUntil: { gte: startDate },
      AND: [
        {
          OR: [
            { vehicleTypes: { isEmpty: true } }, // No vehicle type restriction
            { vehicleTypes: { has: vehicleType } }, // Specific vehicle type
          ],
        },
        {
          OR: [
            { regions: { isEmpty: true } }, // No region restriction
            { regions: { has: region } }, // Specific region
          ],
        },
      ],
    },
    orderBy: {
      priority: "desc",
    },
  });

  if (seasonalConfigs.length === 0) {
    return 1.0;
  }

  const applicableConfig = seasonalConfigs[0];
  return applicableConfig.priceMultiplier ?? 1.0;
};

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
      // Check global usage limit
      if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
        // Check per-user usage limit
        if (coupon.perUserLimit) {
          const userUsageCount = await prisma.vehicleBooking.count({
            where: {
              userId,
              couponCode,
              status: {
                notIn: [RentalStatus.CANCELLED],
              },
            },
          });

          if (userUsageCount >= coupon.perUserLimit) {
            return {
              discounts,
              totalDiscount,
              error: `You have already used this coupon ${coupon.perUserLimit} time(s). Per-user limit reached.`,
            };
          }
        }

        // Check minimum booking amount
        if (
          !coupon.minBookingAmount ||
          grossAmount >= coupon.minBookingAmount
        ) {
          // Check minimum days
          if (!coupon.minDays || durationDays >= coupon.minDays) {
            // Check vehicle type restriction
            const isVehicleTypeApplicable =
              coupon.vehicleTypes.length === 0 ||
              coupon.vehicleTypes.includes(vehicleType);

            if (isVehicleTypeApplicable) {
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
            } else {
              return {
                discounts,
                totalDiscount,
                error: `This coupon is not applicable for ${vehicleType} vehicle type.`,
              };
            }
          } else {
            return {
              discounts,
              totalDiscount,
              error: `Minimum ${coupon.minDays} days required for this coupon.`,
            };
          }
        } else {
          return {
            discounts,
            totalDiscount,
            error: `Minimum booking amount of NPR ${coupon.minBookingAmount} required for this coupon.`,
          };
        }
      } else {
        return {
          discounts,
          totalDiscount,
          error: "This coupon has reached its usage limit.",
        };
      }
    } else {
      return {
        discounts,
        totalDiscount,
        error: "Invalid or expired coupon code.",
      };
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

const calculateRefund = (booking: any) => {
  const now = new Date();
  const startDate = new Date(booking.startDate);

  const daysUntilStart = Math.ceil(
    (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  let refundPercentage = 0;
  let reason = "";
  let policy = "";

  if (daysUntilStart >= 7) {
    refundPercentage = 90;
    reason =
      "Booking cancelled 7 or more days before trip start. Eligible for 90% refund.";
    policy = "CANCEL_7_DAYS_BEFORE";
  } else if (daysUntilStart >= 3) {
    refundPercentage = 50;
    reason =
      "Booking cancelled 3–6 days before trip start. Eligible for 50% refund.";
    policy = "CANCEL_3_TO_6_DAYS";
  } else if (daysUntilStart >= 1) {
    refundPercentage = 25;
    reason =
      "Booking cancelled 1–2 days before trip start. Eligible for 25% refund.";
    policy = "CANCEL_1_TO_2_DAYS";
  } else {
    refundPercentage = 0;
    reason =
      "Booking cancelled on or after trip start date. No refund applicable.";
    policy = "NO_REFUND";
  }

  const refundAmount = (booking.totalPrice * refundPercentage) / 100;

  return {
    refundPercentage,
    refundAmount,
    reason,
    policy,
  };
};

export {
  calculateDriverPricing,
  calculateDiscounts,
  calculateRefund,
  getSeasonalMultiplier,
};
