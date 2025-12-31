import prisma from "../config/prisma";

export const getGuidePricingForTour = async (tourId: string) => {
  // Try tour-specific pricing first
  let pricing = await prisma.tourGuidePricing.findFirst({
    where: { tourId, isActive: true },
  });

  // Fallback to default if not found
  if (!pricing) {
    pricing = await prisma.tourGuidePricing.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }

  return pricing;
};
