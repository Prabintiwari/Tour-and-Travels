import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import connectCloudinary from "../config/cloudinary";

/**
 * Static upload - same folder for all uploads
 * @param folderName - Cloudinary folder (e.g., "users/profile", "vehicles")
 * @param allowedFormats - Optional array of allowed formats ['jpg', 'png', 'jpeg']
 */
const cloudinaryUpload = (
  folderName: string,
  allowedFormats = ["jpg", "jpeg", "png"]
) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req, file) => ({
      folder: folderName,
      allowed_formats: allowedFormats,
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    }),
  });
  return multer({ storage });
};

/**
 * Dynamic upload from URL params
 * Usage: cloudinaryUploadFromParams('destinations/gallery', 'destinationId')
 * 
 * @param baseFolderName - Base folder path (e.g., "destinations/gallery")
 * @param paramName - URL parameter name (e.g., "destinationId")
 * @param allowedFormats - Optional array of allowed formats
 * 
 * @example
 * // Route: POST /api/v1/galleries/:destinationId
 * router.post(
 *   '/:destinationId',
 *   cloudinaryUploadFromParams('destinations/gallery', 'destinationId').array('images', 10),
 *   handler
 * );
 */
const cloudinaryUploadFromParams = (
  baseFolderName: string,
  paramName: string,
  allowedFormats = ["jpg", "jpeg", "png"]
) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req, file) => {
      const id = (req.params as Record<string, string>)[paramName];

      if (!id) {
        throw new Error(`Missing URL parameter: ${paramName}`);
      }

      return {
        folder: `${baseFolderName}/${id}`,
        allowed_formats: allowedFormats,
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      };
    },
  });

  return multer({ storage });
};

/**
 * Dynamic upload from request body
 * Usage: cloudinaryUploadFromBody('tours', 'destinationId')
 * 
 * @param baseFolderName - Base folder path (e.g., "tours")
 * @param fieldName - Body field name (e.g., "destinationId")
 * @param allowedFormats - Optional array of allowed formats
 * 
 * @example
 * // Route: POST /api/v1/tours
 * router.post(
 *   '/',
 *   cloudinaryUploadFromBody('tours', 'destinationId').array('images', 10),
 *   handler
 * );
 */
const cloudinaryUploadFromBody = (
  baseFolderName: string,
  fieldName: string,
  allowedFormats = ['jpg', 'jpeg', 'png']
) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req, file) => {
      const id = (req.body as Record<string, any>)[fieldName];

      if (!id) {
        throw new Error(`Missing field in body: ${fieldName}`);
      }

      return {
        folder: `${baseFolderName}/${id}`,
        allowed_formats: allowedFormats,
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      };
    },
  });

  return multer({ storage });
};

export { 
  cloudinaryUpload, 
  cloudinaryUploadFromParams,
  cloudinaryUploadFromBody 
};

/**
 * ==================== USAGE GUIDE ====================
 * 
 * 1. STATIC FOLDER (same for all):
 * import { cloudinaryUpload } from '../config/upload';
 * router.post('/profile', cloudinaryUpload('users/profile').single('avatar'), handler);
 * 
 * 2. DYNAMIC FROM PARAMS (URL-based):
 * import { cloudinaryUploadFromParams } from '../config/upload';
 * router.post('/:destinationId', cloudinaryUploadFromParams('destinations/gallery', 'destinationId').array('images'), handler);
 * 
 * 3. DYNAMIC FROM BODY (create operations):
 * import { cloudinaryUploadFromBody } from '../config/upload';
 * router.post('/', cloudinaryUploadFromBody('tours', 'destinationId').array('images'), handler);
 */