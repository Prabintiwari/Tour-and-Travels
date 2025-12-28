import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

interface CloudinaryFile {
  path: string;
  filename: string;
  mimetype: string;
}

// Create gallery for a destination (or add images if already exists)
const createOrUpdateGallery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId } = req.params;
    const files = req.files as CloudinaryFile[] | undefined;

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

    const imageUrls = files.map((file: CloudinaryFile) => file.path);
    const imagePublicIds = files.map((file: CloudinaryFile) => file.filename);

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

export { createOrUpdateGallery };
