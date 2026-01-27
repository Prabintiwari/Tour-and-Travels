import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import {
  tourParamsSchema,
  bulkDeleteReviewSchema,
  reviewIdParamsSchema,
  destinationIdParamSchema,
  updateTourReviewSchema,
  reviewQuerySchema,
  reviewStatisticsQuerySchema,
  vehicleParamsSchema,
  vehicleReviewIdParamsSchema,
  updateVehicleReviewSchema,
} from "../schema";
import { AuthRequest } from "../middleware/auth";
import { BookingStatus, RentalStatus } from "@prisma/client";
import { ZodError } from "zod";
import {
  createVehicleReviewSchema,
  vehicleReviewIdQuerySchema,
} from "../schema";

// Create a tour review
const createVehicleReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({
        status: 401,
        success: false,
        message: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return next({ status: 404, success: false, message: "User not found!" });
    }

    const validatedData = createVehicleReviewSchema.parse(req.body);

    // Validate vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
    });

    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user has completed a booking for this tour
    const completedBooking = await prisma.vehicleBooking.findFirst({
      where: {
        userId,
        vehicleId: validatedData.vehicleId,
        status: RentalStatus.COMPLETED,
      },
    });

    if (!completedBooking) {
      return res.status(403).json({
        success: false,
        message: "You can only review a vehicle after completing a rental",
      });
    }

    // Check if review already exists
    const existingReview = await prisma.vehicleReview.findUnique({
      where: {
        vehicleId_userId: {
          vehicleId: validatedData.vehicleId,
          userId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message:
          "You have already reviewed this vehicle. You can update your existing review instead.",
      });
    }

    // Create review
    const review = await prisma.vehicleReview.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        userId: userId,
        vehicleId: vehicle.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
          },
        },
      },
    });

    next({
      status: 201,
      success: true,
      message: "Review created successfully",
      data: {
        review,
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

// Get all reviews for a vehicle
const getVehicleReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const { page, limit, rating, sortBy, sortOrder } =
      vehicleReviewIdQuerySchema.parse(req.query);

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Validate vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found",
      });
    }

    // Build filter
    const where: any = { vehicleId };
    if (rating) {
      where.rating = rating;
    }

    const validSortFields = ["updatedAt", "createdAt"];

    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    // Get total count
    const total = await prisma.vehicleReview.count({ where });

    // Get reviews with user details
    const reviews = await prisma.vehicleReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
      orderBy: { [sortField]: sortOrderValue },

      skip,
      take: limitNumber,
    });

    // Calculate statistics
    const allReviews = await prisma.vehicleReview.findMany({
      where: { vehicleId },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    // Initialize distribution
    const ratingDistribution: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };

    // Bucket ratings (handles decimals like 4.5)
    reviews.forEach((r) => {
      const bucket = Math.floor(r.rating);

      if (bucket >= 1 && bucket <= 5) {
        ratingDistribution[bucket.toString()]++;
      }
    });

    next({
      status: 200,
      success: true,
      data: {
        reviews: reviews,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
        stats: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
          ratingDistribution,
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

// Get a single review by ID
const getVehicleReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { reviewId } = vehicleReviewIdParamsSchema.parse(req.params);

    const review = await prisma.vehicleReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
            images: true,
          },
        },
      },
    });

    if (!review) {
      return next({ status: 404, success: false, message: "Review not found" });
    }

    next({
      status: 200,
      success: true,
      data: review,
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

// Update own review
const updateVehicleReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { reviewId } = reviewIdParamsSchema.parse(req.params);
    const validatedData = updateVehicleReviewSchema.parse(req.body);

    if (!userId) {
      return next({
        status: 401,
        success: false,
        message: "Authentication required",
      });
    }

    // Check if there's actually data to update
    if (!validatedData.rating && !validatedData.comment) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (rating or comment) must be provided for update",
      });
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.vehicleReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return next({ status: 404, success: false, message: "Review not found" });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      });
    }

    // Update review
    const review = await prisma.vehicleReview.update({
      where: { id: reviewId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
          },
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Review updated successfully",
      data: {
        review,
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

// // Delete own review
// const deleteReview = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const userId = req.id;
//     const { reviewId } = reviewIdParamsSchema.parse(req.params);

//     if (!userId) {
//       return next({
//         status: 401,
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     // Check if review exists and belongs to user
//     const existingReview = await prisma.tourReview.findUnique({
//       where: { id: reviewId },
//     });

//     if (!existingReview) {
//       return next({ status: 404, success: false, message: "Review not found" });
//     }

//     if (existingReview.userId !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: "You can only delete your own reviews",
//       });
//     }

//     await prisma.tourReview.delete({
//       where: { id: reviewId },
//     });

//     next({
//       status: 200,
//       success: true,
//       message: "Review deleted successfully",
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Get current user's reviews
// const getUserReviews = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const userId = req.id;
//     const { page, limit, rating, sortBy, sortOrder } =
//       vehicleReviewIdQuerySchema.parse(req.query);
//     const pageNumber = page ?? 1;
//     const limitNumber = limit ?? 10;
//     const skip = (pageNumber - 1) * limitNumber;

//     if (!userId) {
//       return next({
//         status: 401,
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     const where: any = { userId };
//     if (rating) {
//       where.rating = rating;
//     }
//     const validSortFields = ["updatedAt", "createdAt"];

//     const sortField = validSortFields.includes(sortBy as string)
//       ? (sortBy as string)
//       : "createdAt";

//     const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

//     const total = await prisma.tourReview.count({ where });

//     const reviews = await prisma.tourReview.findMany({
//       where,
//       include: {
//         tour: {
//           select: {
//             id: true,
//             title: true,
//             coverImage: true,
//           },
//         },
//         destination: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         [sortField]: sortOrderValue,
//       },
//       skip,
//       take: limitNumber,
//     });

//     next({
//       status: 200,
//       success: true,
//       data: {
//         reviews,
//         pagination: {
//           total,
//           page: pageNumber,
//           limit: limitNumber,
//           totalPages: Math.ceil(total / limitNumber),
//         },
//       },
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Check if user can review a tour
// const canReviewTour = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const userId = req.id;
//     const { tourId } = tourParamsSchema.parse(req.params);

//     if (!userId) {
//       return next({
//         status: 401,
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     // Check if user has completed booking
//     const completedBooking = await prisma.tourBooking.findFirst({
//       where: {
//         userId,
//         tourId,
//         status: BookingStatus.COMPLETED,
//       },
//     });

//     if (!completedBooking) {
//       return next({
//         status: 200,
//         success: true,
//         data: {
//           canReview: false,
//           reason: "You have not completed this tour yet",
//         },
//       });
//     }

//     // Check if review already exists
//     const existingReview = await prisma.tourReview.findUnique({
//       where: {
//         tourId_userId: {
//           tourId,
//           userId,
//         },
//       },
//     });

//     if (existingReview) {
//       return next({
//         status: 201,
//         success: true,
//         data: {
//           canReview: false,
//           reason:
//             "You have already reviewed this tour. You can only update existing review.",
//           existingReview: {
//             id: existingReview.id,
//             rating: existingReview.rating,
//             comment: existingReview.comment,
//           },
//         },
//       });
//     }

//     next({
//       status: 200,
//       success: true,
//       data: {
//         canReview: true,
//         reason: "You can review this tour",
//       },
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Get all reviews
// const getAllReviews = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {
//       page,
//       limit,
//       rating,
//       tourId,
//       destinationId,
//       userId,
//       sortBy,
//       sortOrder,
//     } = reviewQuerySchema.parse(req.query);

//     const pageNumber = page ?? 1;
//     const limitNumber = limit ?? 10;
//     const skip = (pageNumber - 1) * limitNumber;

//     const where: any = {};
//     if (rating) {
//       where.rating = rating;
//     }
//     if (tourId) {
//       where.tourId = tourId as string;
//     }
//     if (destinationId) {
//       where.destinationId = destinationId as string;
//     }
//     if (userId) {
//       where.userId = userId as string;
//     }

//     const validSortFields = ["updatedAt", "createdAt"];
//     const sortField = validSortFields.includes(sortBy as string)
//       ? (sortBy as string)
//       : "createdAt";

//     const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

//     const total = await prisma.tourReview.count({ where });

//     const reviews = await prisma.tourReview.findMany({
//       where,
//       include: {
//         user: {
//           select: {
//             id: true,
//             fullName: true,
//             email: true,
//             profileImage: true,
//           },
//         },
//         tour: {
//           select: {
//             id: true,
//             title: true,
//           },
//         },
//         destination: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         [sortField]: sortOrderValue,
//       },
//       skip,
//       take: limitNumber,
//     });

//     next({
//       status: 200,
//       success: true,
//       data: {
//         reviews,
//         pagination: {
//           total,
//           page: pageNumber,
//           limit: limitNumber,
//           totalPages: Math.ceil(total / limitNumber),
//         },
//       },
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Delete any review (admin)
// const adminDeleteReview = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { reviewId } = reviewIdParamsSchema.parse(req.params);

//     const review = await prisma.tourReview.findUnique({
//       where: { id: reviewId },
//     });

//     if (!review) {
//       return next({ status: 404, success: false, message: "Review not found" });
//     }

//     await prisma.tourReview.delete({
//       where: { id: reviewId },
//     });

//     next({
//       status: 200,
//       success: true,
//       message: "Review deleted successfully",
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Get review statistics (admin)
// const getReviewStatistics = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { tourId, destinationId } = reviewStatisticsQuerySchema.parse(
//       req.query,
//     );

//     const where: any = {};
//     if (tourId) {
//       where.tourId = tourId as string;
//     }
//     if (destinationId) {
//       where.destinationId = destinationId as string;
//     }

//     const reviews = await prisma.tourReview.findMany({
//       where,
//       select: {
//         rating: true,
//         createdAt: true,
//       },
//     });

//     const totalReviews = reviews.length;

//     const averageRating =
//       totalReviews > 0
//         ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
//         : 0;

//     // Initialize distribution
//     const ratingDistribution: Record<string, number> = {
//       "1": 0,
//       "2": 0,
//       "3": 0,
//       "4": 0,
//       "5": 0,
//     };

//     // Bucket ratings
//     reviews.forEach((r) => {
//       const bucket = Math.floor(r.rating);

//       if (bucket >= 1 && bucket <= 5) {
//         ratingDistribution[bucket.toString()]++;
//       }
//     });

//     // Reviews by month (last 6 months)
//     const now = new Date();
//     const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

//     const reviewsByMonth = reviews
//       .filter((r) => r.createdAt >= sixMonthsAgo)
//       .reduce((acc: any, review) => {
//         const month = review.createdAt.toISOString().slice(0, 7);
//         acc[month] = (acc[month] || 0) + 1;
//         return acc;
//       }, {});

//     next({
//       status: 200,
//       success: true,
//       data: {
//         totalReviews,
//         averageRating: Math.round(averageRating * 10) / 10,
//         ratingDistribution,
//         reviewsByMonth,
//         filters: {
//           tourId: tourId || null,
//           destinationId: destinationId || null,
//         },
//       },
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// Bulk delete reviews (admin)
// const bulkDeleteReviews = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { reviewIds } = bulkDeleteReviewSchema.parse(req.body);

//     if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "reviewIds array is required and must not be empty",
//       });
//     }

//     const result = await prisma.tourReview.deleteMany({
//       where: {
//         id: {
//           in: reviewIds,
//         },
//       },
//     });

//     next({
//       status: 200,
//       success: true,
//       message: `${result.count} review(s) deleted successfully`,
//       data: {
//         deletedCount: result.count,
//       },
//     });
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return next({
//         status: 400,
//         message: error.issues || "Validation failed",
//       });
//     }
//     next({
//       status: 500,
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

export {
  createVehicleReview,
  getVehicleReviews,
  getVehicleReviewById,
  updateVehicleReview,
//   deleteReview,
//   getUserReviews,
//   canReviewTour,
//   getAllReviews,
//   adminDeleteReview,
//   getReviewStatistics,
//   bulkDeleteReviews,
};
