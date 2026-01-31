import { Request, Response, NextFunction } from "express";
import {
  allFAQSQuerySchema,
  allVehicleFAQSQuerySchema,
  bulkCreateTourFAQsSchema,
  bulkCreateVehicleFAQsSchema,
  bulkDeleteFAQsSchema,
  bulkUpdateTourFAQsSchema,
  copyFAQsParamsSchema,
  copyFAQsSchema,
  createVehicleFAQSchema,
  FAQsStatisticsQuerySchema,
  searchFAQSQuerySchema,
  searchVehicleFAQSQuerySchema,
  tourFAQIdParamsSchema,
  tourFAQSQuerySchema,
  tourParamsSchema,
  updateTourFAQSchema,
  updateVehicleFAQSchema,
  vehicleFAQIdParamsSchema,
  vehicleFAQSQuerySchema,
  vehicleParamsSchema,
} from "../schema";
import prisma from "../config/prisma";
import { ZodError } from "zod";

// Create a new FAQ - Admin
const createVehicleFAQ = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = createVehicleFAQSchema.parse(req.body);

    // Validate tour exists
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

    // Check for duplicate question
    if (!validatedData.question) {
      return next({
        status: 400,
        success: false,
        message: "Question is required",
      });
    }

    const normalizedQuestion = validatedData.question.trim().toLowerCase();

    const existingFAQ = await prisma.vehicleFAQ.findUnique({
      where: {
        vehicleId_questionLower: {
          vehicleId: validatedData.vehicleId,
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

    const faq = await prisma.vehicleFAQ.create({
      data: {
        vehicleId: validatedData.vehicleId,
        vehicleType: validatedData.vehicleType,
        question: validatedData.question,
        questionLower: validatedData.question.toLowerCase(),
        answer: validatedData.answer,
        isActive: validatedData.isActive,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
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

// Get all active FAQs for a vehicle
const getVehicleFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);

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

    const faqs = await prisma.vehicleFAQ.findMany({
      where: {
        vehicleId,
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

// Get a single FAQ by ID
const getVehicleFAQById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { faqId } = vehicleFAQIdParamsSchema.parse(req.params);

    const faq = await prisma.vehicleFAQ.findUnique({
      where: { id: faqId },
      include: {
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
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

// Search FAQs across all vehicles
const searchVehicleFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, sortBy, sortOrder, searchQuery, vehicleId } =
      searchVehicleFAQSQuerySchema.parse(req.query);

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

    if (vehicleId) {
      where.vehicleId = vehicleId as string;
    }

    const [faqs, total] = await Promise.all([
      prisma.vehicleFAQ.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              model: true,
              brand: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicleFAQ.count({ where }),
    ]);

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

// Get all FAQs for a vehicle (including inactive) - Admin
const getAllVehicleFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const {
      page,
      limit,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = vehicleFAQSQuerySchema.parse(req.query);

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

    const where: any = { vehicleId };
    if (isActive !== undefined) {
      where.isActive = isActive === true;
    }

    const [faqs, total] = await Promise.all([
      prisma.vehicleFAQ.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: {
          [sortBy as string]: sortOrder as string,
        },
      }),
      prisma.vehicleFAQ.count({ where }),
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

// Get all FAQs across all vehicles
const getAllFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page,
      limit,
      isActive,
      vehicleId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = allVehicleFAQSQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === true;
    }
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const [faqs, total] = await Promise.all([
      prisma.vehicleFAQ.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              model: true,
              brand: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder as string,
        },
        skip,
        take: limit,
      }),

      prisma.vehicleFAQ.count({ where }),
    ]);

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

// Get FAQ by ID (including inactive)
const getAdminVehicleFAQById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { faqId } = vehicleFAQIdParamsSchema.parse(req.params);

    const faq = await prisma.vehicleFAQ.findUnique({
      where: { id: faqId },
      include: {
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
          },
        },
      },
    });

    if (!faq) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    next({ status: 200, success: true, data: faq });
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

// Update an FAQ
const updateVehicleFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = vehicleFAQIdParamsSchema.parse(req.params);
    const validatedData = updateVehicleFAQSchema.parse(req.body);

    if (
      validatedData.question === undefined &&
      validatedData.answer === undefined &&
      validatedData.isActive === undefined
    ) {
      return next({
        status: 400,
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    const existingFAQ = await prisma.vehicleFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return next({
        status: 404,
        success: false,
        message: "FAQ not found",
      });
    }

    const normalizedQuestion = validatedData.question
      ? validatedData.question.trim().toLowerCase()
      : undefined;

    if (
      normalizedQuestion &&
      normalizedQuestion !== existingFAQ.questionLower
    ) {
      const duplicateFAQ = await prisma.vehicleFAQ.findFirst({
        where: {
          vehicleId: existingFAQ.vehicleId,
          questionLower: normalizedQuestion,
          id: { not: faqId },
        },
      });

      if (duplicateFAQ) {
        return next({
          status: 409,
          success: false,
          message: "A FAQ with this question already exists for this vehicle",
        });
      }
    }

    const updateData: any = {
      ...validatedData,
    };

    if (normalizedQuestion) {
      updateData.questionLower = normalizedQuestion;
    }

    const faq = await prisma.vehicleFAQ.update({
      where: { id: faqId },
      data: updateData,
      include: {
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
          },
        },
      },
    });

    return next({
      status: 200,
      success: true,
      message: "FAQ updated successfully",
      data: { faq },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

//Toggle FAQ active status
const toggleVehicleFAQStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { faqId } = vehicleFAQIdParamsSchema.parse(req.params);

    const existingFAQ = await prisma.vehicleFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    const faq = await prisma.vehicleFAQ.update({
      where: { id: faqId },
      data: {
        isActive: !existingFAQ.isActive,
      },
    });

    next({
      status: 200,
      success: true,
      message: `Vehicle FAQ ${faq.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        id: faq.id,
        isActive: faq.isActive,
        updatedAt: faq.updatedAt.toISOString(),
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

// Delete an FAQ
const deleteVehicleFAQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = vehicleFAQIdParamsSchema.parse(req.params);

    const existingFAQ = await prisma.vehicleFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return next({ status: 404, success: false, message: "FAQ not found" });
    }

    await prisma.vehicleFAQ.delete({
      where: { id: faqId },
    });

    next({ status: 200, success: true, message: "FAQ deleted successfully" });
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

// Bulk create FAQs for a vehicle
const bulkCreateVehicleFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const { faqs } = bulkCreateVehicleFAQsSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found",
      });
    }

    const normalizedQuestions = faqs.map((faq) =>
      faq.question.trim().toLowerCase(),
    );

    // Prevent duplicate questions in request
    const uniqueQuestions = new Set(normalizedQuestions);
    if (uniqueQuestions.size !== normalizedQuestions.length) {
      return next({
        status: 400,
        success: false,
        message: "Duplicate FAQ questions are not allowed in the same request",
      });
    }

    const existingFAQs = await prisma.vehicleFAQ.findMany({
      where: {
        vehicleId,
        questionLower: { in: normalizedQuestions },
      },
      select: {
        questionLower: true,
      },
    });

    if (existingFAQs.length > 0) {
      return next({
        status: 409,
        success: false,
        message: "Some FAQ questions already exist for this vehicle",
        data: {
          existingQuestions: existingFAQs.map((f) => f.questionLower),
        },
      });
    }

    // Bulk create FAQs
    const createdFAQs = await prisma.$transaction(
      faqs.map((faq, index) =>
        prisma.vehicleFAQ.create({
          data: {
            vehicleId,
            vehicleType:faq.vehicleType,
            question: faq.question.trim(),
            questionLower: normalizedQuestions[index],
            answer: faq.answer.trim(),
            isActive: faq.isActive ?? true,
          },
        }),
      ),
    );

    return next({
      status: 201,
      success: true,
      message: `${createdFAQs.length} FAQ(s) created successfully`,
      data: {
        faqs: createdFAQs,
        count: createdFAQs.length,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Bulk update FAQs
const bulkUpdateFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { faqs } = bulkUpdateTourFAQsSchema.parse(req.body);
    console.log(faqs);

    const normalizedQuestions = faqs
      .filter((f) => f.question)
      .map((f) => f.question!.trim().toLowerCase());

    // Check for duplicates inside the request
    const uniqueQuestions = new Set(normalizedQuestions);
    if (uniqueQuestions.size !== normalizedQuestions.length) {
      return next({
        status: 400,
        success: false,
        message: "Duplicate FAQ questions are not allowed in the same request",
      });
    }

    //  Check duplicates against DB (exclude current faqIds)
    if (normalizedQuestions.length > 0) {
      const existingFAQs = await prisma.tourFAQ.findMany({
        where: {
          questionLower: { in: normalizedQuestions },
          NOT: { id: { in: faqs.map((f) => f.faqId) } },
        },
        select: { questionLower: true },
      });

      if (existingFAQs.length > 0) {
        return next({
          status: 409,
          success: false,
          message: "Some FAQ questions already exist in the database",
          data: existingFAQs.map((f) => f.questionLower),
        });
      }
    }

    const updatedFAQs = await prisma.$transaction(
      faqs.map((update) => {
        const { faqId, question, ...data } = update;

        return prisma.tourFAQ.update({
          where: { id: faqId },
          data: {
            ...data,
            question: question?.trim(),
            questionLower: question ? question.trim().toLowerCase() : undefined,
          },
        });
      }),
    );

    return next({
      status: 200,
      success: true,
      message: `${updatedFAQs.length} FAQ(s) updated successfully`,
      data: {
        faqs: updatedFAQs,
        count: updatedFAQs.length,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Bulk delete FAQs
const bulkDeleteFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { faqIds } = bulkDeleteFAQsSchema.parse(req.body);

    const validIds = [...new Set(faqIds)].filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id),
    );

    if (validIds.length === 0) {
      return next({
        status: 400,
        success: false,
        message: "No valid FAQ IDs provided",
      });
    }

    const result = await prisma.tourFAQ.deleteMany({
      where: { id: { in: validIds } },
    });

    if (result.count === 0) {
      return next({
        status: 404,
        success: false,
        message: "No FAQs found for the provided IDs",
      });
    }

    next({
      status: 200,
      success: true,
      message: `${result.count} FAQ(s) deleted successfully`,
      data: { deletedCount: result.count },
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
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

//Copy FAQs from one tour to another
const copyFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceTourId, targetTourId } = copyFAQsParamsSchema.parse(
      req.params,
    );
    const { includeInactive } = copyFAQsSchema.parse(req.body);

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

    const where: any = { tourId: sourceTourId };
    if (!includeInactive) where.isActive = true;

    const sourceFAQs = await prisma.tourFAQ.findMany({ where });

    if (sourceFAQs.length === 0) {
      return next({
        status: 404,
        success: false,
        message: "No FAQs found in source tour",
      });
    }

    //  Prevent duplicates in target tour
    const targetQuestions = await prisma.tourFAQ.findMany({
      where: { tourId: targetTourId },
      select: { questionLower: true },
    });

    const existingQuestionsSet = new Set(
      targetQuestions.map((q) => q.questionLower),
    );

    const faqsToCopy = sourceFAQs.filter(
      (faq) => !existingQuestionsSet.has(faq.question.trim().toLowerCase()),
    );

    if (faqsToCopy.length === 0) {
      return next({
        status: 409,
        success: false,
        message: "All FAQs already exist in the target tour",
      });
    }

    //  Copy FAQs to target tour
    const copiedFAQs = await prisma.$transaction(
      faqsToCopy.map((faq) =>
        prisma.tourFAQ.create({
          data: {
            tourId: targetTourId,
            question: faq.question.trim(),
            questionLower: faq.question.trim().toLowerCase(),
            answer: faq.answer,
            isActive: faq.isActive,
          },
        }),
      ),
    );

    return next({
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
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get FAQ statistics
const getFAQStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tourId, destinationId } = FAQsStatisticsQuerySchema.parse(
      req.query,
    );

    let tourIds: string[] | undefined;

    if (destinationId) {
      const tours = await prisma.tour.findMany({
        where: { destinationId },
        select: { id: true },
      });
      tourIds = tours.map((tour) => tour.id);
    } else if (tourId) {
      tourIds = [tourId];
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
      }),
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
  createVehicleFAQ,
  getVehicleFAQs,
  getVehicleFAQById,
  searchVehicleFAQs,
  getAllVehicleFAQs,
  getAllFAQs,
  getAdminVehicleFAQById,
  updateVehicleFAQ,
  toggleVehicleFAQStatus,
  deleteVehicleFAQ,
  bulkCreateVehicleFAQs,
  bulkUpdateFAQs,
  bulkDeleteFAQs,
  copyFAQs,
  getFAQStatistics,
};
