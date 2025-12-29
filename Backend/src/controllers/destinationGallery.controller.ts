import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";

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



export {
  createOrUpdateGallery,
  getGalleryByDestination,
  
};
