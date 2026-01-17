import multer from "multer";
import crypto from "crypto";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import connectCloudinary from "../config/cloudinary";
import { FILE_LIMITS } from "../config/constants/image.constants";
import { Request } from "express";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

class CloudinaryUploadError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "CloudinaryUploadError";
  }
}

const imageFileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Only image files (${ALLOWED_FORMATS.join(", ")}) are allowed. Got: ${
          file.mimetype
        }`
      )
    );
  }
  cb(null, true);
};

const createMulter = (storage: any) => {
  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: FILE_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024,
    },
  });
};

/**
 * Upload files to a static Cloudinary folder
 * @param folderName - The folder name in Cloudinary
 */
const cloudinaryUpload = (folderName: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req: Request, file: Express.Multer.File) => {
      try {
        const config = {
          folder: folderName,
          allowed_formats: ALLOWED_FORMATS,
          public_id: crypto.randomUUID(),
          transformation: [{ width: 800, height: 800, crop: "limit" }],
        };

        return config;
      } catch (err: any) {
        throw new CloudinaryUploadError(
          `Failed to configure upload: ${err.message}`,
          "UPLOAD_CONFIG_ERROR"
        );
      }
    },
  });

  return createMulter(storage);
};

/**
 * Upload files to a dynamic Cloudinary folder based on route params
 * @param baseFolderName - The base folder name (e.g., "vehicles,tour,destination")
 * @param paramName - The route parameter name (e.g., "vehicleId,tourId,destintionId")
 */
const cloudinaryUploadFromParams = (
  baseFolderName: string,
  paramName: string
) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req: Request, file: Express.Multer.File) => {
      try {
        const id = req.params[paramName];

        if (!id) {
          const error = new CloudinaryUploadError(
            `Missing required route parameter: ${paramName}`,
            "MISSING_PARAM"
          );
          throw error;
        }

        const config = {
          folder: `${baseFolderName}/${id}`,
          allowed_formats: ALLOWED_FORMATS,
          public_id: crypto.randomUUID(),
          transformation: [{ width: 800, height: 800, crop: "limit" }],
        };

        return config;
      } catch (err: any) {
        console.error(`[CloudinaryUploadFromParams] Error:`, {
          message: err.message,
          code: err.code,
          name: err.name,
        });

        if (err instanceof CloudinaryUploadError) {
          throw err;
        }
        throw new CloudinaryUploadError(
          `Upload configuration failed: ${err.message}`,
          "UPLOAD_CONFIG_ERROR"
        );
      }
    },
  });

  return createMulter(storage);
};

/**
 * Clean up uploaded files from Cloudinary
 * @param publicIds - Array of Cloudinary public IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
const cleanupCloudinary = async (publicIds: string[]): Promise<void> => {
  const results = await Promise.allSettled(
    publicIds.map(async (id) => {
      try {
        const result = await connectCloudinary.uploader.destroy(id);

        if (result.result !== "ok" && result.result !== "not found") {
          console.warn(
            `[CleanupCloudinary] Unexpected result for ${id}:`,
            result
          );
        } else {
          console.log(`[CleanupCloudinary] Successfully deleted: ${id}`);
        }
        return result;
      } catch (error: any) {
        console.error(
          `[CleanupCloudinary] Failed to delete ${id}:`,
          error.message
        );
        throw error;
      }
    })
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[CleanupCloudinary] Cleanup complete:`, {
    total: publicIds.length,
    successful,
    failed,
  });

  // If all deletions failed, throw an error
  if (failed === publicIds.length) {
    throw new CloudinaryUploadError(
      "All cleanup operations failed",
      "CLEANUP_FAILED"
    );
  }
};

/**
 * Middleware to handle Multer errors
 * Use this after your upload middleware
 */
const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    console.error("[MulterError]", {
      code: err.code,
      message: err.message,
      field: err.field,
    });

    const errorMessages: { [key: string]: string } = {
      LIMIT_FILE_SIZE: `File too large. Maximum size is ${FILE_LIMITS.MAX_IMAGE_SIZE_MB}MB`,
      LIMIT_FILE_COUNT: "Too many files uploaded",
      LIMIT_UNEXPECTED_FILE: err.message || "Unexpected file field",
      LIMIT_FIELD_KEY: "Field name too long",
      LIMIT_FIELD_VALUE: "Field value too long",
      LIMIT_FIELD_COUNT: "Too many fields",
      LIMIT_PART_COUNT: "Too many parts",
    };

    return res.status(400).json({
      success: false,
      message: errorMessages[err.code] || err.message,
      code: err.code,
    });
  }

  if (err instanceof CloudinaryUploadError) {
    console.error("[CloudinaryUploadError]", {
      code: err.code,
      message: err.message,
    });

    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Unknown error - pass to global error handler
  console.error("[UnknownUploadError]", err);
  next(err);
};

export {
  cloudinaryUpload,
  cloudinaryUploadFromParams,
  cleanupCloudinary,
  handleMulterError,
  CloudinaryUploadError,
};
