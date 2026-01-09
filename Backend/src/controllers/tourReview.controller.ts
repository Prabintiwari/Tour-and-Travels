import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import {
  updateTourReviewSchema,
  reviewQuerySchema,
  ReviewQueryParams,
  ReviewIdQueryParams,
} from "../schema";
import { AuthRequest } from "../middleware/auth";
import { BookingStatus } from "@prisma/client";

// Create a tour review
const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const validatedData = req.body;

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: validatedData.tourId },
    });

    if (!tour) {
      return next({ status: 404, success: false, message: "Tour not found" });
    }

    // Validate destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: tour.destinationId },
    });

    if (!destination) {
      return next({
        status: 404,
        success: false,
        message: "Destination not found",
      });
    }

    // Check if user has completed a booking for this tour
    const completedBooking = await prisma.tourBooking.findFirst({
      where: {
        userId,
        tourId: validatedData.tourId,
        status: BookingStatus.COMPLETED,
      },
    });

    if (!completedBooking) {
      return res.status(403).json({
        success: false,
        message: "You can only review tours you have completed",
      });
    }

    // Check if review already exists
    const existingReview = await prisma.tourReview.findUnique({
      where: {
        tourId_userId: {
          tourId: validatedData.tourId,
          userId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message:
          "You have already reviewed this tour. You can update your existing review instead.",
      });
    }

    // Create review
    const review = await prisma.tourReview.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: {
        review,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get all reviews for a tour
const getTourReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;
    const { page, limit, rating, sortBy, sortOrder } =
      req.query as unknown as ReviewIdQueryParams;

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return next({ status: 404, success: false, message: "Tour not found" });
    }

    // Build filter
    const where: any = { tourId };
    if (rating) {
      where.rating = rating;
    }

    const validSortFields = ["updatedAt", "createdAt"];

    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    // Get total count
    const total = await prisma.tourReview.count({ where });

    // Get reviews with user details
    const reviews = await prisma.tourReview.findMany({
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
    const allReviews = await prisma.tourReview.findMany({
      where: { tourId },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      "1": allReviews.filter((r) => r.rating === 1).length,
      "2": allReviews.filter((r) => r.rating === 2).length,
      "3": allReviews.filter((r) => r.rating === 3).length,
      "4": allReviews.filter((r) => r.rating === 4).length,
      "5": allReviews.filter((r) => r.rating === 5).length,
    };

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
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get a single review by ID
 * @route GET /api/reviews/:reviewId
 * @access Public
 */
const getReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.tourReview.findUnique({
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
        tour: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
        destination: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
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
      data: {
        id: review.id,
        userId: review.userId,
        tourId: review.tourId,
        destinationId: review.destinationId,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
        tour: review.tour,
        destination: review.destination,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get reviews by destination
 * @route GET /api/destinations/:destinationId/reviews
 * @access Public
 */
const getDestinationReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = req.params;
    const { page, limit, rating, sortBy, sortOrder } =
      req.query as unknown as ReviewQueryParams;

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Validate destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return next({
        status: 404,
        success: false,
        message: "Destination not found",
      });
    }

    const where: any = { destinationId };
    if (rating) {
      where.rating = rating;
    }
    const validSortFields = ["updatedAt", "createdAt"];

    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const total = await prisma.tourReview.count({ where });

    const reviews = await prisma.tourReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        [sortField]: sortOrderValue,
      },
      skip,
      take: limitNumber,
    });

    // Calculate stats
    const allReviews = await prisma.tourReview.findMany({
      where: { destinationId },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    next({
      status: 200,
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
        stats: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
        },
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// ==================== USER ENDPOINTS ====================

/**
 * Update own review
 * @route PUT /api/reviews/:reviewId
 * @access Private (User)
 */
const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const validatedData = updateTourReviewSchema.parse(req.body);

    // Check if there's actually data to update
    if (!validatedData.rating && !validatedData.comment) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (rating or comment) must be provided for update",
      });
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.tourReview.findUnique({
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
    const review = await prisma.tourReview.update({
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
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Review updated successfully",
      data: {
        id: review.id,
        userId: review.userId,
        tourId: review.tourId,
        destinationId: review.destinationId,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
        tour: review.tour,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete own review
 * @route DELETE /api/reviews/:reviewId
 * @access Private (User)
 */
const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.tourReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return next({ status: 404, success: false, message: "Review not found" });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    await prisma.tourReview.delete({
      where: { id: reviewId },
    });

    next({
      status: 200,
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get current user's reviews
 * @route GET /api/user/reviews
 * @access Private (User)
 */
const getUserReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { page, limit, rating, sortBy, sortOrder } = reviewQuerySchema.parse(
      req.query
    );
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const where: any = { userId };
    if (rating) {
      where.rating = rating;
    }
    const validSortFields = ["updatedAt", "createdAt"];

    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const total = await prisma.tourReview.count({ where });

    const reviews = await prisma.tourReview.findMany({
      where,
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
        destination: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortField]: sortOrderValue,
      },
      skip,
      take: limitNumber,
    });

    next({
      status: 200,
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Check if user can review a tour
 * @route GET /api/tours/:tourId/can-review
 * @access Private (User)
 */
const canReviewTour = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { tourId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user has completed booking
    const completedBooking = await prisma.tourBooking.findFirst({
      where: {
        userId,
        tourId,
        status: "COMPLETED",
      },
    });

    if (!completedBooking) {
      return next({
        status: 200,
        success: true,
        data: {
          canReview: false,
          reason: "You have not completed this tour yet",
        },
      });
    }

    // Check if review already exists
    const existingReview = await prisma.tourReview.findUnique({
      where: {
        tourId_userId: {
          tourId,
          userId,
        },
      },
    });

    if (existingReview) {
      return next({
        status: 200,
        success: true,
        data: {
          canReview: false,
          reason: "You have already reviewed this tour",
          existingReview: {
            id: existingReview.id,
            rating: existingReview.rating,
            comment: existingReview.comment,
          },
        },
      });
    }

    next({
      status: 200,
      success: true,
      data: {
        canReview: true,
        reason: "You can review this tour",
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all reviews (admin)
 * @route GET /api/admin/reviews
 * @access Private (Admin)
 */
const getAllReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page,
      limit,
      rating,
      tourId,
      destinationId,
      userId,
      sortBy,
      sortOrder,
    } = req.query as unknown as ReviewQueryParams;
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (rating) {
      where.rating = rating;
    }
    if (tourId) {
      where.tourId = tourId as string;
    }
    if (destinationId) {
      where.destinationId = destinationId as string;
    }
    if (userId) {
      where.userId = userId as string;
    }

    const validSortFields = ["updatedAt", "createdAt"];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const total = await prisma.tourReview.count({ where });

    const reviews = await prisma.tourReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
        destination: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortField]: sortOrderValue,
      },
      skip,
      take: limitNumber,
    });

    next({
      status: 200,
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete any review (admin)
 * @route DELETE /api/admin/reviews/:reviewId
 * @access Private (Admin)
 */
const adminDeleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.tourReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return next({ status: 404, success: false, message: "Review not found" });
    }

    await prisma.tourReview.delete({
      where: { id: reviewId },
    });

    next({
      status: 200,
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get review statistics (admin)
 * @route GET /api/admin/reviews/statistics
 * @access Private (Admin)
 */
const getReviewStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId, destinationId } = req.query;

    const where: any = {};
    if (tourId) {
      where.tourId = tourId as string;
    }
    if (destinationId) {
      where.destinationId = destinationId as string;
    }

    const reviews = await prisma.tourReview.findMany({
      where,
      select: {
        rating: true,
        createdAt: true,
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      "1": reviews.filter((r) => r.rating === 1).length,
      "2": reviews.filter((r) => r.rating === 2).length,
      "3": reviews.filter((r) => r.rating === 3).length,
      "4": reviews.filter((r) => r.rating === 4).length,
      "5": reviews.filter((r) => r.rating === 5).length,
    };

    // Reviews by month (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const reviewsByMonth = reviews
      .filter((r) => r.createdAt >= sixMonthsAgo)
      .reduce((acc: any, review) => {
        const month = review.createdAt.toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

    next({
      status: 200,
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        reviewsByMonth,
        filters: {
          tourId: tourId || null,
          destinationId: destinationId || null,
        },
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Bulk delete reviews (admin)
 * @route POST /api/admin/reviews/bulk-delete
 * @access Private (Admin)
 */
const bulkDeleteReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "reviewIds array is required and must not be empty",
      });
    }

    const result = await prisma.tourReview.deleteMany({
      where: {
        id: {
          in: reviewIds,
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: `${result.count} review(s) deleted successfully`,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

export {
  createReview,
  getTourReviews,
  getReviewById,
  getDestinationReviews,
  updateReview,
  deleteReview,
  getUserReviews,
  canReviewTour,
  getAllReviews,
  adminDeleteReview,
  getReviewStatistics,
  bulkDeleteReviews,
};
