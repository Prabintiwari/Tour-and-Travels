import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  allFAQSQuerySchema,
  createTourFAQSchema,
  searchFAQSQuerySchema,
  tourFAQIdParamsSchema,
  tourFAQSQueryInput,
  tourParamsSchema,
  updateTourFAQSchema,
} from "../schema";
import prisma from "../config/prisma";

// Create a new FAQ - Admin
const createFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTourFAQSchema.parse(req.body);

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: validatedData.tourId },
    });

    if (!tour) {
      return next({ status: 404, success: false, message: "Tour not found" });
    }

    // Check for duplicate question
    if (!validatedData.question) {
      return next({
        status: 400,
        success: false,
        message: "Question is required",
      });
    }

    const normalizedQuestion = validatedData.question.trim().toLowerCase();

    const existingFAQ = await prisma.tourFAQ.findUnique({
      where: {
        tourId_questionLower: {
          tourId: validatedData.tourId,
          questionLower: normalizedQuestion,
        },
      },
    });

    if (existingFAQ) {
      next({
        status: 400,
        success: false,
        message: "A FAQ with this question already exists for this tour",
      });
    }

    const faq = await prisma.tourFAQ.create({
      data: {
        tourId: validatedData.tourId,
        question: validatedData.question,
        questionLower: validatedData.question.toLowerCase(),
        answer: validatedData.answer,
        isActive: validatedData.isActive,
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    next({
      status: 201,
      success: true,
      message: "FAQ created successfully",
      data: {
        faq,
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

//Get all active FAQs for a tour
const getTourFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return next({ status: 404, success: false, message: "Tour not found" });
    }

    const faqs = await prisma.tourFAQ.findMany({
      where: {
        tourId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    next({
      status: 200,
      success: true,
      data: {
        faqs,
        total: faqs.length,
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

//Get a single FAQ by ID
const getFAQById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = tourFAQIdParamsSchema.parse(req.params);

    const faq = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
    });

    if (!faq || !faq.isActive) {
      return next({
        status: 404,
        success: false,
        message: "FAQ not found or inactive",
      });
    }

    next({
      status: 200,
      success: true,
      data: { faq },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

//Search FAQs across all tours
const searchFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder, searchQuery, tourId } =
      searchFAQSQuerySchema.parse(req.query);

    const where: any = {
      isActive: true,
      OR: [
        {
          question: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          answer: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ],
    };

    if (tourId) {
      where.tourId = tourId as string;
    }

    const total = await prisma.tourFAQ.count({ where });

    const faqs = await prisma.tourFAQ.findMany({
      where,
      include: {
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    next({
      status: 200,
      success: true,
      data: {
        faqs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        searchQuery,
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

// Get all FAQs for a tour (including inactive)
const getAllTourFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;
    const {
      page,
      limit,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as unknown as tourFAQSQueryInput;

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

    const where: any = { tourId };
    if (isActive !== undefined) {
      where.isActive = isActive === true;
    }

    const [faqs, total] = await Promise.all([
      prisma.tourFAQ.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: {
          [sortBy as string]: sortOrder as string,
        },
      }),
      prisma.tourFAQ.count({ where }),
    ]);

    // Get statistics
    const stats = {
      total: faqs.length,
      active: faqs.filter((f) => f.isActive).length,
      inactive: faqs.filter((f) => !f.isActive).length,
    };

    next({
      status: 200,
      success: true,
      data: {
        faqs,
        stats,
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

// Get all FAQs across all tours - Admin
const getAllFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page,
      limit,
      isActive,
      tourId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = allFAQSQuerySchema.parse(req.query);
    console.log(typeof page, typeof limit);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === true;
    }
    if (tourId) {
      where.tourId = tourId as string;
    }

    const [faqs, total] = await Promise.all([
      prisma.tourFAQ.findMany({
        where,
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              destination: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder as string,
        },
        skip,
        take: limit,
      }),

      prisma.tourFAQ.count({ where }),
    ]);

    // Get statistics
    const allFAQs = await prisma.tourFAQ.findMany({
      where,
      select: { isActive: true },
    });

    const stats = {
      total: faqs.length,
      active: faqs.filter((f) => f.isActive).length,
      inactive: faqs.filter((f) => !f.isActive).length,
    };

    next({
      status: 200,
      success: true,
      data: {
        faqs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats,
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

// Get FAQ by ID (including inactive)
const getAdminFAQById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { faqId } = tourFAQIdParamsSchema.parse(req.params);

    const faq = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            destination: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!faq) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    next({ status: 200, success: true, data: faq });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update an FAQ - Admin
 * @route PUT /api/admin/faqs/:faqId
 * @access Private (Admin)
 */
const updateFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = tourFAQIdParamsSchema.parse(req.params);
    const validatedData = updateTourFAQSchema.parse(req.body);

    // Check if there's data to update
    if (
      !validatedData.question &&
      !validatedData.answer &&
      validatedData.isActive === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    const existingFAQ = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    // Check for duplicate question if question is being updated
    if (
      validatedData.question &&
      validatedData.question !== existingFAQ.question
    ) {
      const duplicateFAQ = await prisma.tourFAQ.findFirst({
        where: {
          tourId: existingFAQ.tourId,
          question: {
            equals: validatedData.question,
            mode: "insensitive",
          },
          id: {
            not: faqId,
          },
        },
      });

      if (duplicateFAQ) {
        return next({
          status: 409,
          success: false,
          message: "A FAQ with this question already exists for this tour",
        });
      }
    }

    const faq = await prisma.tourFAQ.update({
      where: { id: faqId },
      data: validatedData,
      include: {
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
      message: "FAQ updated successfully",
      data: {
        id: faq.id,
        tourId: faq.tourId,
        question: faq.question,
        answer: faq.answer,
        isActive: faq.isActive,
        tour: faq.tour,
        createdAt: faq.createdAt.toISOString(),
        updatedAt: faq.updatedAt.toISOString(),
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
 * Toggle FAQ active status - Admin
 * @route PATCH /api/admin/faqs/:faqId/toggle
 * @access Private (Admin)
 */
const toggleFAQStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { faqId } = tourFAQIdParamsSchema.parse(req.params);

    const existingFAQ = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    const faq = await prisma.tourFAQ.update({
      where: { id: faqId },
      data: {
        isActive: !existingFAQ.isActive,
      },
    });

    next({
      status: 200,
      success: true,
      message: `FAQ ${faq.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        id: faq.id,
        isActive: faq.isActive,
        updatedAt: faq.updatedAt.toISOString(),
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
 * Delete an FAQ - Admin
 * @route DELETE /api/admin/faqs/:faqId
 * @access Private (Admin)
 */
const deleteFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = tourFAQIdParamsSchema.parse(req.params);

    const existingFAQ = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    await prisma.tourFAQ.delete({
      where: { id: faqId },
    });

    next({ status: 200, success: true, message: "FAQ deleted successfully" });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Bulk create FAQs for a tour - Admin
 * @route POST /api/admin/tours/:tourId/faqs/bulk
 * @access Private (Admin)
 */
const bulkCreateFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);
    const { faqs } = req.body;

    if (!Array.isArray(faqs) || faqs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "FAQs array is required and must not be empty",
      });
    }

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return next({ status: 404, success: false, message: "Tour not found" });
    }

    // Validate each FAQ
    const faqSchema = z.object({
      question: z.string().min(5).max(500),
      answer: z.string().min(10).max(2000),
      isActive: z.boolean().default(true).optional(),
    });

    const validatedFAQs = faqs.map((faq, index) => {
      try {
        return faqSchema.parse(faq);
      } catch (error) {
        throw new Error(`Invalid FAQ at index ${index}: ${error}`);
      }
    });

    // Bulk create using transaction
    const createdFAQs = await prisma.$transaction(
      validatedFAQs.map((faq) =>
        prisma.tourFAQ.create({
          data: {
            tourId,
            question: faq.question,
            questionLower: faq.question.toLowerCase(),
            answer: faq.answer,
            isActive: faq.isActive ?? true,
          },
        })
      )
    );

    next({
      status: 201,
      success: true,
      message: `${createdFAQs.length} FAQ(s) created successfully`,
      data: {
        faqs: createdFAQs,
        count: createdFAQs.length,
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
 * Bulk update FAQs - Admin
 * @route PUT /api/admin/faqs/bulk-update
 * @access Private (Admin)
 */
const bulkUpdateFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required and must not be empty",
      });
    }

    const updateSchema = z.object({
      id: z.string(),
      question: z.string().min(5).max(500).optional(),
      answer: z.string().min(10).max(2000).optional(),
      isActive: z.boolean().optional(),
    });

    const validatedUpdates = updates.map((update, index) => {
      try {
        return updateSchema.parse(update);
      } catch (error) {
        throw new Error(`Invalid update at index ${index}: ${error}`);
      }
    });

    const updatedFAQs = await prisma.$transaction(
      validatedUpdates.map((update) => {
        const { id, ...data } = update;
        return prisma.tourFAQ.update({
          where: { id },
          data,
        });
      })
    );

    next({
      status: 200,
      success: true,
      message: `${updatedFAQs.length} FAQ(s) updated successfully`,
      data: {
        faqs: updatedFAQs,
        count: updatedFAQs.length,
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
 * Bulk delete FAQs - Admin
 * @route POST /api/admin/faqs/bulk-delete
 * @access Private (Admin)
 */
const bulkDeleteFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { faqIds } = (req.body);

    if (!Array.isArray(faqIds) || faqIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "faqIds array is required and must not be empty",
      });
    }

    const result = await prisma.tourFAQ.deleteMany({
      where: {
        id: {
          in: faqIds,
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: `${result.count} FAQ(s) deleted successfully`,
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

/**
 * Reorder FAQs for a tour - Admin
 * @route PUT /api/admin/tours/:tourId/faqs/reorder
 * @access Private (Admin)
 */
const reorderFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = tourParamsSchema.parse(req.params);
    const { faqOrder } = req.body; // Array of FAQ IDs in desired order

    if (!Array.isArray(faqOrder) || faqOrder.length === 0) {
      return res.status(400).json({
        success: false,
        message: "faqOrder array is required and must not be empty",
      });
    }

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return next({ status: 404, success: false, message: "Tour not found" });
    }

    // Verify all FAQs belong to this tour
    const faqs = await prisma.tourFAQ.findMany({
      where: {
        id: { in: faqOrder },
        tourId,
      },
    });

    if (faqs.length !== faqOrder.length) {
      return res.status(400).json({
        success: false,
        message: "Some FAQs do not belong to this tour or do not exist",
      });
    }

    // Note: Since we don't have an 'order' field in the schema,
    // we'll update the updatedAt field to reflect the new order
    // In production, you might want to add an 'order' or 'position' field
    const updates = await prisma.$transaction(
      faqOrder.map((faqId, index) =>
        prisma.tourFAQ.update({
          where: { id: faqId },
          data: { updatedAt: new Date(Date.now() + index) },
        })
      )
    );

    next({
      status: 200,
      success: true,
      message: "FAQs reordered successfully",
      data: {
        reorderedCount: updates.length,
        note: 'Consider adding an "order" field to the schema for better sorting',
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
 * Copy FAQs from one tour to another - Admin
 * @route POST /api/admin/tours/:sourceTourId/faqs/copy/:targetTourId
 * @access Private (Admin)
 */
const copyFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceTourId, targetTourId } = req.params;
    const { includeInactive = false } = req.body;

    // Validate both tours exist
    const [sourceTour, targetTour] = await Promise.all([
      prisma.tour.findUnique({ where: { id: sourceTourId } }),
      prisma.tour.findUnique({ where: { id: targetTourId } }),
    ]);

    if (!sourceTour) {
      return next({
        status: 404,
        success: false,
        message: "Source tour not found",
      });
    }

    if (!targetTour) {
      return next({
        status: 404,
        success: false,
        message: "Target tour not found",
      });
    }

    // Get FAQs from source tour
    const where: any = { tourId: sourceTourId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const sourceFAQs = await prisma.tourFAQ.findMany({ where });

    if (sourceFAQs.length === 0) {
      return next({
        status: 404,
        success: false,
        message: "No FAQs found in source tour",
      });
    }

    // Create FAQs in target tour
    const copiedFAQs = await prisma.$transaction(
      sourceFAQs.map((faq) =>
        prisma.tourFAQ.create({
          data: {
            tourId: targetTourId,
            question: faq.question,
            questionLower: faq.question.toLowerCase(),
            answer: faq.answer,
            isActive: faq.isActive,
          },
        })
      )
    );

    next({
      status: 201,
      success: true,
      message: `${copiedFAQs.length} FAQ(s) copied successfully`,
      data: {
        sourceTourId,
        targetTourId,
        copiedCount: copiedFAQs.length,
        faqs: copiedFAQs,
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
 * Get FAQ statistics - Admin
 * @route GET /api/admin/faqs/statistics
 * @access Private (Admin)
 */
const getFAQStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId, destinationId } = req.query;

    let tourIds: string[] | undefined;

    // If filtering by destination, get all tours in that destination
    if (destinationId) {
      const tours = await prisma.tour.findMany({
        where: { destinationId: destinationId as string },
        select: { id: true },
      });
      tourIds = tours.map((t) => t.id);
    } else if (tourId) {
      tourIds = [tourId as string];
    }

    const where: any = {};
    if (tourIds) {
      where.tourId = { in: tourIds };
    }

    const [totalFAQs, activeFAQs, inactiveFAQs, toursWithFAQs] =
      await Promise.all([
        prisma.tourFAQ.count({ where }),
        prisma.tourFAQ.count({ where: { ...where, isActive: true } }),
        prisma.tourFAQ.count({ where: { ...where, isActive: false } }),
        prisma.tourFAQ.groupBy({
          by: ["tourId"],
          where,
          _count: true,
        }),
      ]);

    const avgFAQsPerTour =
      toursWithFAQs.length > 0 ? totalFAQs / toursWithFAQs.length : 0;

    const topTours = toursWithFAQs
      .sort((a, b) => b._count - a._count)
      .slice(0, 5);

    const topToursWithDetails = await Promise.all(
      topTours.map(async (item) => {
        const tour = await prisma.tour.findUnique({
          where: { id: item.tourId },
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        });
        return {
          ...tour,
          faqCount: item._count,
        };
      })
    );

    next({
      status: 200,
      success: true,
      data: {
        totalFAQs,
        activeFAQs,
        inactiveFAQs,
        toursWithFAQs: toursWithFAQs.length,
        avgFAQsPerTour: Math.round(avgFAQsPerTour * 10) / 10,
        topToursWithMostFAQs: topToursWithDetails,
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
export {
  createFAQ,
  getTourFAQs,
  getFAQById,
  searchFAQs,
  getAllTourFAQs,
  getAllFAQs,
  getAdminFAQById,
  updateFAQ,
  toggleFAQStatus,
  deleteFAQ,
  bulkCreateFAQs,
  bulkUpdateFAQs,
  bulkDeleteFAQs,
  reorderFAQs,
  copyFAQs,
  getFAQStatistics,
};
