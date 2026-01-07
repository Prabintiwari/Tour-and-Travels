import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";
import { destinationIdParamSchema, DestinationQueryParams } from "../schema";

// Create gallery for a destination (or add images if already exists)
const createOrUpdateGallery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = req.params;
    const files = req.files as Express.Multer.File[];

    // Validate destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return next({
        status: 400,
        success: false,
        message: "Destination not found",
      });
    }

    if (!files || files.length === 0) {
      return next({
        status: 400,
        success: false,
        message: "No files provided",
      });
    }

    const imageUrls = files.map((file: any) => file.path);
    const imagePublicIds = files.map((file: any) => file.filename);

    let gallery = await prisma.destinationGallery.findUnique({
      where: { destinationId },
    });

    if (gallery) {
      gallery = await prisma.destinationGallery.update({
        where: { id: gallery.id },
        data: {
          imageUrl: {
            push: imageUrls,
          },
          imagePublicId: {
            push: imagePublicIds,
          },
        },
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });
    } else {
      gallery = await prisma.destinationGallery.create({
        data: {
          destinationId,
          imageUrl: imageUrls,
          imagePublicId: imagePublicIds,
        },
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });
    }

    next({
      status: 200,
      success: true,
      message: "Gallery images added successfully",
      data: {
        ...gallery,
        totalImages: gallery.imageUrl.length,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get gallery for a specific destination
const getGalleryByDestination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = req.params;

    // Verify destination exists
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

    const gallery = await prisma.destinationGallery.findUnique({
      where: { destinationId },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            location: true,
            region: true,
            description: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!gallery) {
      next({
        status: 404,
        success: false,
        message: "No gallery found for this destination",
      });
      return;
    }

    next({
      status: 200,
      success: true,
      data: {
        ...gallery,
        totalImages: gallery.imageUrl.length,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all galleries with pagination
const getAllGalleries = async (
  req: Request<{}, {}, {}, DestinationQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page,
      limit,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filters: any = {};

    // Search by destination name, location, or region
    if (search) {
      filters.destination = {
        OR: [
          { name: { contains: search as string, mode: "insensitive" } },
          { location: { contains: search as string, mode: "insensitive" } },
          { region: { contains: search as string, mode: "insensitive" } },
        ],
      };
    }
    // Validate sortBy
    const validSortFields = ["createdAt", "updatedAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const sortOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    const galleries = await prisma.destinationGallery.findMany({
      where: filters,
      skip,
      take: limitNumber,
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            location: true,
            region: true,
          },
        },
      },
      orderBy: { [sortField]: sortOrder },
    });

    const total = await prisma.destinationGallery.count({ where: filters });

    const enrichedGalleries = galleries.map((gallery) => ({
      ...gallery,
      totalImages: gallery.imageUrl.length,
    }));

    next({
      status: 200,
      success: true,
      data: {
        enrichedGalleries,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  Remove specific images from destination gallery
const removeGalleryImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = req.params;
    const { imagePublicIds } = req.body as { imagePublicIds: string[] };

    // Validation
    if (
      !imagePublicIds ||
      !Array.isArray(imagePublicIds) ||
      imagePublicIds.length === 0
    ) {
      return next({
        status: 400,
        success: false,
        message: "No valid image IDs provided for deletion",
      });
    }

    // Get current gallery
    const gallery = await prisma.destinationGallery.findUnique({
      where: { destinationId },
    });

    if (!gallery) {
      return next({
        status: 404,
        success: false,
        message: "Gallery not found for this destination",
      });
    }

    // Track successful and failed deletions
    const successfulDeletions: string[] = [];
    const failedDeletions: string[] = [];

    // Delete images from Cloudinary one by one
    for (const publicId of imagePublicIds) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === "ok") {
          successfulDeletions.push(publicId);
        } else {
          failedDeletions.push(publicId);
        }
      } catch (deleteError) {
        failedDeletions.push(publicId);
      }
    }

    // Remove ONLY successfully deleted images from database
    const updatedImageUrls = gallery.imageUrl.filter(
      (_, index) => !successfulDeletions.includes(gallery.imagePublicId[index])
    );
    const updatedPublicIds = gallery.imagePublicId.filter(
      (id) => !successfulDeletions.includes(id)
    );

    // Update database with remaining images
    const updatedGallery = await prisma.destinationGallery.update({
      where: { id: gallery.id },
      data: {
        imageUrl: updatedImageUrls,
        imagePublicId: updatedPublicIds,
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
    return next({
      status: 200,
      success: true,
      message: `Successfully removed ${successfulDeletions.length} image(s)`,
      data: {
        ...updatedGallery,
        totalImages: updatedGallery.imageUrl.length,
        summary: {
          requested: imagePublicIds.length,
          successful: successfulDeletions.length,
          failed: failedDeletions.length,
        },
        failedDeletions: failedDeletions.length > 0 ? failedDeletions : null,
      },
    });
  } catch (error: any) {
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  Delete entire gallery for a destination
const deleteGallery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = req.params;

    const gallery = await prisma.destinationGallery.findUnique({
      where: { destinationId },
    });

    if (!gallery) {
      next({
        status: 404,
        success: false,
        message: "Gallery not found for this destination",
      });
      return;
    }

    // Delete all images from Cloudinary
    const failedDeletions: string[] = [];
    const successfulDeletions: string[] = [];

    for (const publicId of gallery.imagePublicId) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === "ok") {
          successfulDeletions.push(publicId);
        } else {
          failedDeletions.push(publicId);
        }
      } catch (deleteError) {
        failedDeletions.push(publicId);
      }
    }

    // Delete gallery from database
    await prisma.destinationGallery.delete({
      where: { id: gallery.id },
    });

    next({
      status: 200,
      success: true,
      message: "Gallery deleted successfully",
      data: {
        successful: successfulDeletions.length,
        failedDeletions: failedDeletions.length > 0 ? failedDeletions : null,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  createOrUpdateGallery,
  getGalleryByDestination,
  getAllGalleries,
  removeGalleryImages,
  deleteGallery,
};
