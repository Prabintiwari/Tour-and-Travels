import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import connectCloudinary from "../config/cloudinary";

/**
 * @param folderName - Cloudinary folder (e.g., "users/profile", "tours/cover", "vehicles")
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
 * Dynamic upload - folder created based on parameter (e.g., destinationId)
 * Usage: cloudinaryUploadDynamic('destinations/gallery', 'destinationId')
 * @param baseFolderName - Base folder path (e.g., "destinations/gallery")
 * @param paramName - URL parameter name (e.g., "destinationId")
 * @param allowedFormats - Optional array of allowed formats
 */
const cloudinaryUploadDynamic = (
  baseFolderName: string,
  paramName: string,
  allowedFormats = ["jpg", "jpeg", "png"]
) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req, file) => {
      // Get dynamic folder name from request params
      const dynamicId = (req.params as Record<string, string>)[paramName];

      if (!dynamicId) {
        throw new Error(`Missing parameter: ${paramName}`);
      }

      return {
        folder: `${baseFolderName}/${dynamicId}`, // e.g., "destinations/gallery/dest123"
        allowed_formats: allowedFormats,
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      };
    },
  });
  return multer({ storage });
};

export { cloudinaryUpload, cloudinaryUploadDynamic };
