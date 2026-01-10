import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createTourFAQSchema, updateTourFAQSchema } from "../schema";
import prisma from "../config/prisma";

/**
 * Create a new FAQ - Admin
 * @route POST /api/admin/faqs
 * @access Private (Admin)
 */
const createFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTourFAQSchema.parse(req.body);

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: validatedData.tourId },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    // Check for duplicate question
    const existingFAQ = await prisma.tourFAQ.findFirst({
      where: {
        tourId: validatedData.tourId,
        question: {
          equals: validatedData.question,
          mode: "insensitive",
        },
      },
    });

    if (existingFAQ) {
      return res.status(409).json({
        success: false,
        message: "A FAQ with this question already exists for this tour",
        data: {
          existingFAQId: existingFAQ.id,
        },
      });
    }

    const faq = await prisma.tourFAQ.create({
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

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active FAQs for a tour
 * @route GET /api/tours/:tourId/faqs
 * @access Public
 */
const getTourFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = req.params;

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
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

    res.status(200).json({
      success: true,
      data: {
        faqs: faqs.map((faq) => ({
          id: faq.id,
          tourId: faq.tourId,
          question: faq.question,
          answer: faq.answer,
          isActive: faq.isActive,
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        })),
        total: faqs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single FAQ by ID
 * @route GET /api/faqs/:faqId
 * @access Public
 */
const getFAQById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = req.params;

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
      return res.status(404).json({
        success: false,
        message: "FAQ not found or inactive",
      });
    }

    res.status(200).json({
      success: true,
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
  } catch (error) {
    next(error);
  }
};

/**
 * Search FAQs across all tours
 * @route GET /api/faqs/search
 * @access Public
 */
const searchFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query: searchQuery, tourId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchQuery || typeof searchQuery !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

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
      skip: (page - 1) * limit,
      take: limit,
    });

    res.status(200).json({
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
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all FAQs for a tour (including inactive) - Admin
 * @route GET /api/admin/tours/:tourId/faqs
 * @access Private (Admin)
 */
const getAllTourFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;
    const { isActive, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Validate tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    const where: any = { tourId };
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const faqs = await prisma.tourFAQ.findMany({
      where,
      orderBy: {
        [sortBy as string]: sortOrder as string,
      },
    });

    // Get statistics
    const stats = {
      total: faqs.length,
      active: faqs.filter((f) => f.isActive).length,
      inactive: faqs.filter((f) => !f.isActive).length,
    };

    res.status(200).json({
      success: true,
      data: {
        faqs: faqs.map((faq) => ({
          id: faq.id,
          tourId: faq.tourId,
          question: faq.question,
          answer: faq.answer,
          isActive: faq.isActive,
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        })),
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all FAQs across all tours - Admin
 * @route GET /api/admin/faqs
 * @access Private (Admin)
 */
const getAllFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const {
      isActive,
      tourId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }
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
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get statistics
    const allFAQs = await prisma.tourFAQ.findMany({
      where,
      select: { isActive: true },
    });

    const stats = {
      total: allFAQs.length,
      active: allFAQs.filter((f) => f.isActive).length,
      inactive: allFAQs.filter((f) => !f.isActive).length,
    };

    res.status(200).json({
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ by ID (Admin - including inactive)
 * @route GET /api/admin/faqs/:faqId
 * @access Private (Admin)
 */
const getAdminFAQById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { faqId } = req.params;

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
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an FAQ - Admin
 * @route PUT /api/admin/faqs/:faqId
 * @access Private (Admin)
 */
const updateFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = req.params;
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
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
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
        return res.status(409).json({
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

    res.status(200).json({
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
  } catch (error) {
    next(error);
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
    const { faqId } = req.params;

    const existingFAQ = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    const faq = await prisma.tourFAQ.update({
      where: { id: faqId },
      data: {
        isActive: !existingFAQ.isActive,
      },
    });

    res.status(200).json({
      success: true,
      message: `FAQ ${faq.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        id: faq.id,
        isActive: faq.isActive,
        updatedAt: faq.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an FAQ - Admin
 * @route DELETE /api/admin/faqs/:faqId
 * @access Private (Admin)
 */
const deleteFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = req.params;

    const existingFAQ = await prisma.tourFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    await prisma.tourFAQ.delete({
      where: { id: faqId },
    });

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    next(error);
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
    const { tourId } = req.params;
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
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
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
            answer: faq.answer,
            isActive: faq.isActive ?? true,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `${createdFAQs.length} FAQ(s) created successfully`,
      data: {
        faqs: createdFAQs,
        count: createdFAQs.length,
      },
    });
  } catch (error) {
    next(error);
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

    res.status(200).json({
      success: true,
      message: `${updatedFAQs.length} FAQ(s) updated successfully`,
      data: {
        faqs: updatedFAQs,
        count: updatedFAQs.length,
      },
    });
  } catch (error) {
    next(error);
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
    const { faqIds } = req.body;

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

    res.status(200).json({
      success: true,
      message: `${result.count} FAQ(s) deleted successfully`,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder FAQs for a tour - Admin
 * @route PUT /api/admin/tours/:tourId/faqs/reorder
 * @access Private (Admin)
 */
const reorderFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = req.params;
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
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
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

    res.status(200).json({
      success: true,
      message: "FAQs reordered successfully",
      data: {
        reorderedCount: updates.length,
        note: 'Consider adding an "order" field to the schema for better sorting',
      },
    });
  } catch (error) {
    next(error);
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
      return res.status(404).json({
        success: false,
        message: "Source tour not found",
      });
    }

    if (!targetTour) {
      return res.status(404).json({
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
      return res.status(404).json({
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
            answer: faq.answer,
            isActive: faq.isActive,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `${copiedFAQs.length} FAQ(s) copied successfully`,
      data: {
        sourceTourId,
        targetTourId,
        copiedCount: copiedFAQs.length,
        faqs: copiedFAQs,
      },
    });
  } catch (error) {
    next(error);
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

    res.status(200).json({
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
  } catch (error) {
    next(error);
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