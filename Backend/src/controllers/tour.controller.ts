import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";
import {
  createTourSchema,
  defaultGuidePricingSchema,
  removeTourImagesBodySchema,
  tourParamsSchema,
  TourQueryParams,
  tourQuerySchema,
  updateTourSchema,
} from "../schema";

import {
  calculateDiscountAmount,
  calculateFinalPrice,
} from "../utils/calculateDiscountedPrice";
import { ZodError } from "zod";

// CREATE TOUR WITH OPTIONAL GUIDE PRICING AND DISCOUNT
const createTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTourSchema.parse(req.body);

    // Check if destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: validatedData.destinationId },
    });

    if (!destination) {
      return next({ status: 404, message: "Destination not found" });
    }

    // Validate discount
    if (validatedData.discountActive) {
      // Calculate discount amount based on rate or use direct amount
      const calculatedDiscountAmount = calculateDiscountAmount(
        validatedData.basePrice,
        validatedData.discountRate,
        validatedData.discountAmount
      );

      // Validate discount doesn't exceed base price
      if (calculatedDiscountAmount >= validatedData.basePrice) {
        return next({
          status: 400,
          message: "Discount cannot exceed or equal base price",
        });
      }

      // If discountRate is provided, calculate and set discountAmount
      if (validatedData.discountRate && validatedData.discountRate > 0) {
        validatedData.discountAmount = calculatedDiscountAmount;
      }
      // If discountAmount is provided, calculate and set discountRate
      else if (
        validatedData.discountAmount &&
        validatedData.discountAmount > 0
      ) {
        validatedData.discountRate =
          (validatedData.discountAmount / validatedData.basePrice) * 100;
      }
    }
    const finalPrice = calculateFinalPrice(
      validatedData.basePrice,
      validatedData.discountAmount ?? 0
    );

    const tour = await prisma.tour.create({
      data: {
        destinationId: validatedData.destinationId,
        title: validatedData.title,
        description: validatedData.description,
        numberOfDays: validatedData.numberOfDays,
        basePrice: validatedData.basePrice,
        discountRate: validatedData.discountRate ?? null,
        discountAmount: validatedData.discountAmount ?? null,
        discountActive: validatedData.discountActive ?? false,
        finalTourPrice: finalPrice,
        difficultyLevel: validatedData.difficultyLevel,
        isFeatured: validatedData.isFeatured,
        maxParticipants: validatedData.maxParticipants ?? null,
        minParticipants: validatedData.minParticipants ?? null,
      },
      include: {
        destination: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    // Create guide pricing if any guide price field is provided
    if (
      validatedData.guidePricePerDay !== undefined ||
      validatedData.guidePricePerPerson !== undefined ||
      validatedData.guidePricePerGroup !== undefined
    ) {
      await prisma.tourGuidePricing.create({
        data: {
          tourId: tour.id,
          pricePerDay: validatedData.guidePricePerDay ?? null,
          pricePerPerson: validatedData.guidePricePerPerson ?? null,
          pricePerGroup: validatedData.guidePricePerGroup ?? null,
          minimumCharge: validatedData.guideMinimumCharge ?? null,
          maximumGroupSize: validatedData.guideMaximumGroupSize ?? null,
          description: validatedData.guideDescription ?? null,
          isActive: true,
        },
      });
    }
    // Fetch tour with guide pricing and calculate final price
    const tourWithGuidePricing = await prisma.tour.findUnique({
      where: { id: tour.id },
      include: {
        destination: {
          select: { id: true, name: true, location: true },
        },
        guidePricing: true,
      },
    });

    next({
      status: 201,
      success: true,
      message: "Tour created successfully",
      data: {
        ...tourWithGuidePricing,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// GET TOUR BY ID WITH ALL RELATED DATA
const getTourById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        destination: true,
        schedules: {
          orderBy: { startDate: "asc" },
        },
        faqs: {
          where: { isActive: true },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, fullName: true, profileImage: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        guidePricing: true,
      },
    });

    if (!tour) {
      return next({
        status: 404,
        success: false,
        message: "Tour not found",
      });
    }

    // If no tour-specific guide pricing, get default
    let guidePricing = tour.guidePricing;
    if (!guidePricing) {
      guidePricing = await prisma.tourGuidePricing.findFirst({
        where: { isDefault: true, isActive: true },
      });
    }

    // Calculate final price with discount
    const discountAmount = tour.discountActive
      ? calculateDiscountAmount(
          tour.basePrice,
          tour.discountRate,
          tour.discountAmount
        )
      : 0;

    const finalPrice = calculateFinalPrice(tour.basePrice, discountAmount);

    // Increment views
    await prisma.tour.update({
      where: { id: tourId },
      data: { views: { increment: 1 } },
    });

    next({
      status: 200,
      success: true,
      data: {
        ...tour,
        guidePricing: guidePricing || null,
        finalPrice,
        discountAmount,
        discountPercentage: tour.discountRate?.toFixed(2),
        savings: discountAmount,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// GET ALL TOURS WITH FILTERING
const getAllTours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page,
      limit,
      destinationId,
      difficultyLevel,
      isFeatured,
      minPrice,
      maxPrice,
      search,
      discountedOnly,
    } = tourQuerySchema.parse(req.query);

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;
    const filters: any = { isActive: true };

    if (destinationId) filters.destinationId = destinationId;
    if (difficultyLevel) filters.difficultyLevel = difficultyLevel;
    if (isFeatured === true) filters.isFeatured = true;
    if (isFeatured === false) filters.isFeatured = false;
    if (discountedOnly === "true") filters.discountActive = true;

    // Search in title or description
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Price range filter (based on base price)
    if (minPrice || maxPrice) {
      filters.AND = filters.AND || [];
      if (minPrice)
        filters.AND.push({ basePrice: { gte: parseFloat(minPrice) } });
      if (maxPrice)
        filters.AND.push({ basePrice: { lte: parseFloat(maxPrice) } });
    }

    const tours = await prisma.tour.findMany({
      where: filters,
      skip,
      take: limitNumber,
      include: {
        destination: {
          select: { id: true, name: true, location: true },
        },
        reviews: {
          select: { rating: true },
        },
        guidePricing: true,
        _count: {
          select: { reviews: true, tourBookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.tour.count({ where: filters });

    // Calculate average rating and final prices
    const toursWithRating = tours.map((tour) => {
      const avgRating =
        tour.reviews.length > 0
          ? (
              tour.reviews.reduce((acc, r) => acc + r.rating, 0) /
              tour.reviews.length
            ).toFixed(1)
          : 0;

      // Calculate discount amount and final price
      const discountAmount = tour.discountActive
        ? calculateDiscountAmount(
            tour.basePrice,
            tour.discountRate,
            tour.discountAmount
          )
        : 0;

      const finalPrice = calculateFinalPrice(tour.basePrice, discountAmount);

      const discountPercentage =
        tour.discountActive && discountAmount > 0
          ? (discountAmount / tour.basePrice) * 100
          : 0;

      const { reviews, ...rest } = tour;
      return {
        ...rest,
        averageRating: avgRating,
        finalPrice,
        discountAmount,
        discountPercentage: discountPercentage.toFixed(2),
        savings: discountAmount,
      };
    });

    next({
      status: 200,
      success: true,
      data: {
        tours: toursWithRating,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// UPDATE TOUR (WITH GUIDE PRICING AND DISCOUNT)
const updateTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);
    const validatedData = updateTourSchema.parse(req.body);
    const {
      guidePricePerDay,
      guidePricePerPerson,
      guidePricePerGroup,
      guideMinimumCharge,
      guideMaximumGroupSize,
      guideDescription,
      ...tourData
    } = validatedData;

    // Check if tour exists
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    // Validate discount logic if being updated
    if (tourData.discountActive) {
      const basePrice = tourData.basePrice ?? tour.basePrice;
      const discountRate = tourData.discountRate ?? tour.discountRate;
      const discountAmount = tourData.discountAmount ?? tour.discountAmount;

      // Calculate discount amount
      const calculatedDiscountAmount = calculateDiscountAmount(
        basePrice,
        discountRate,
        discountAmount
      );

      if (calculatedDiscountAmount >= basePrice) {
        return next({
          status: 400,
          message: "Discount cannot exceed or equal base price",
        });
      }

      // If discountRate is provided, calculate and set discountAmount
      if (tourData.discountRate && tourData.discountRate > 0) {
        tourData.discountAmount = calculatedDiscountAmount;
      }
      // If only discountAmount is provided, calculate discountRate
      else if (tourData.discountAmount && tourData.discountAmount > 0) {
        const currentBasePrice = tourData.basePrice ?? tour.basePrice;
        tourData.discountRate =
          (tourData.discountAmount / currentBasePrice) * 100;
      }
    } else {
      tourData.discountRate = 0;
      tourData.discountAmount = 0;
    }
    const finalPrice = calculateFinalPrice(
      tourData.basePrice ?? tour.basePrice,
      tourData.discountAmount ?? tour.discountAmount ?? 0
    );

    const guideUpdateData: any = {};

    if (guidePricePerDay !== undefined)
      guideUpdateData.pricePerDay = guidePricePerDay;

    if (guidePricePerPerson !== undefined)
      guideUpdateData.pricePerPerson = guidePricePerPerson;

    if (guidePricePerGroup !== undefined)
      guideUpdateData.pricePerGroup = guidePricePerGroup;

    if (guideMinimumCharge !== undefined)
      guideUpdateData.minimumCharge = guideMinimumCharge;

    if (guideMaximumGroupSize !== undefined)
      guideUpdateData.maximumGroupSize = guideMaximumGroupSize;

    if (guideDescription !== undefined)
      guideUpdateData.description = guideDescription;

    const updatedTour = await prisma.$transaction(async (tx) => {
      // Update tour with discount fields
      await tx.tour.update({
        where: { id: tourId },
        data: { ...tourData, finalTourPrice: finalPrice },
      });

      // Update or create guide pricing if provided
      if (Object.keys(guideUpdateData).length > 0) {
        await tx.tourGuidePricing.upsert({
          where: { tourId: tourId },
          update: guideUpdateData,
          create: {
            tourId: tourId,
            pricePerDay: guidePricePerDay ?? null,
            pricePerPerson: guidePricePerPerson ?? null,
            pricePerGroup: guidePricePerGroup ?? null,
            minimumCharge: guideMinimumCharge ?? null,
            maximumGroupSize: guideMaximumGroupSize ?? null,
            description: guideDescription ?? null,
            isActive: true,
          },
        });
      }

      // Fetch updated tour with guide pricing
      return await tx.tour.findUnique({
        where: { id: tourId },
        include: {
          destination: {
            select: { id: true, name: true, location: true },
          },
          guidePricing: true,
        },
      });
    });
    // Calculate final price for response
    const discountAmount = updatedTour?.discountAmount
      ? updatedTour.discountAmount
      : 0;

    next({
      status: 200,
      success: true,
      message: "Tour updated successfully",
      data: {
        ...updatedTour,
        finalPrice,
        discountAmount,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// DELETE TOUR (CASCADE DELETES OTHER AUTOMATICALLY)
const deleteTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    // Delete images from Cloudinary
    if (tour.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(tour.coverImagePublicId);
      } catch (error) {
        console.error("Failed to delete cover image:", error);
      }
    }

    for (const publicId of tour.imagePublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error(`Failed to delete image ${publicId}:`, error);
      }
    }

    // Delete tour (cascades to guidePricing, itineraries, schedules, etc.)
    await prisma.tour.delete({ where: { id: tourId } });

    next({ status: 200, success: true, message: "Tour deleted successfully" });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// ADD IMAGES
const addTourImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);
    const files = req.files as Express.Multer.File[];

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    if (!files || files.length === 0) {
      return next({
        status: 400,
        success: false,
        message: "At least one image is required",
      });
    }

    const coverImageUrl = files[0].path;
    const coverImagePublicId = files[0].filename;
    const imageUrls = files.slice(1).map((file: any) => file.path);
    const imagePublicIds = files.slice(1).map((file: any) => file.filename);

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: {
        coverImage: coverImageUrl,
        coverImagePublicId: coverImagePublicId,
        images: {
          push: imageUrls,
        },
        imagePublicIds: {
          push: imagePublicIds,
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Images added successfully",
      data: updatedTour,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// REMOVE IMAGES
const removeTourImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);
    const { imagePublicIds } = removeTourImagesBodySchema.parse(req.body);

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    const successfulDeletions: string[] = [];
    const failedDeletions: string[] = [];

    for (const publicId of imagePublicIds) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === "ok") {
          successfulDeletions.push(publicId);
        } else {
          failedDeletions.push(publicId);
        }
      } catch (error) {
        failedDeletions.push(publicId);
      }
    }

    let updatedCoverImage;
    let updatedCoverImagePublicId;
    if (
      tour.coverImagePublicId &&
      imagePublicIds.includes(tour.coverImagePublicId)
    ) {
      updatedCoverImage = null;
      updatedCoverImagePublicId = null;
    }

    const updatedImageUrls = tour.images.filter(
      (_, index) => !imagePublicIds.includes(tour.imagePublicIds[index])
    );
    const updatedPublicIds = tour.imagePublicIds.filter(
      (id) => !imagePublicIds.includes(id)
    );

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: {
        coverImage: updatedCoverImage,
        coverImagePublicId: updatedCoverImagePublicId,
        images: updatedImageUrls,
        imagePublicIds: updatedPublicIds,
      },
    });

    next({
      status: 200,
      success: true,
      message: `Successfully removed ${successfulDeletions.length} image(s)`,
      data: {
        ...updatedTour,
        totalImages: updatedTour.images.length,
        summary: {
          requested: imagePublicIds.length,
          successful: successfulDeletions.length,
          failed: failedDeletions.length,
        },
        failedDeletions: failedDeletions.length > 0 ? failedDeletions : null,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// GET GUIDE PRICING FOR SPECIFIC TOUR
const getGuidePricingForTour = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);

    // Try to get tour-specific pricing first
    let guidePricing = await prisma.tourGuidePricing.findUnique({
      where: { tourId },
    });

    // Fallback to default if not found
    if (!guidePricing) {
      guidePricing = await prisma.tourGuidePricing.findFirst({
        where: { isDefault: true, isActive: true },
      });
    }

    next({
      status: 200,
      success: true,
      data: guidePricing,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// SET/UPDATE DEFAULT GUIDE PRICING (ADMIN ONLY)
const setDefaultGuidePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validateData = defaultGuidePricingSchema.parse(req.body);

    // Check if default pricing already exists
    const existingDefault = await prisma.tourGuidePricing.findFirst({
      where: { isDefault: true },
    });

    let guidePricing;

    if (existingDefault) {
      // Update existing default
      guidePricing = await prisma.tourGuidePricing.update({
        where: { id: existingDefault.id },
        data: { ...validateData, isDefault: true },
      });

      next({
        status: 200,
        success: true,
        message: "Default guide pricing updated successfully",
        data: guidePricing,
      });
    } else {
      // Create new default
      guidePricing = await prisma.tourGuidePricing.create({
        data: {
          isDefault: true,
          pricePerDay: validateData.pricePerDay ?? null,
          pricePerPerson: validateData.pricePerPerson ?? null,
          pricePerGroup: validateData.pricePerGroup ?? null,
          minimumCharge: validateData.minimumCharge ?? null,
          maximumGroupSize: validateData.maximumGroupSize ?? null,
          description: validateData.description ?? null,
          isActive: true,
        },
      });

      next({
        status: 201,
        success: true,
        message: "Default guide pricing created successfully",
        data: guidePricing,
      });
    }
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// GET DEFAULT GUIDE PRICING
const getDefaultGuidePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const defaultPricing = await prisma.tourGuidePricing.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultPricing) {
      return next({
        status: 404,
        message: "Default guide pricing not found",
      });
    }

    next({
      status: 200,
      success: true,
      data: defaultPricing,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// DELETE TOUR-SPECIFIC GUIDE PRICING (Revert to default)
const deleteTourGuidePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);

    const guidePricing = await prisma.tourGuidePricing.findUnique({
      where: { tourId },
    });

    if (!guidePricing) {
      return next({
        status: 404,
        message: "Tour-specific guide pricing not found",
      });
    }

    if (guidePricing.isDefault) {
      return next({
        status: 400,
        message: "Default guide pricing cannot be deleted",
      });
    }

    await prisma.tourGuidePricing.delete({
      where: { id: guidePricing.id },
    });

    next({
      status: 200,
      success: true,
      message:
        "Tour-specific guide pricing disabled. Tour will now use default pricing.",
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

export {
  createTour,
  getTourById,
  getAllTours,
  updateTour,
  deleteTour,
  addTourImages,
  removeTourImages,
  getGuidePricingForTour,
  setDefaultGuidePricing,
  getDefaultGuidePricing,
  deleteTourGuidePricing,
};
