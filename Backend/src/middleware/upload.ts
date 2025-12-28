import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import connectCloudinary from "../config/cloudinary";

/**
 * @param folderName - Cloudinary folder (e.g., "users/profile", "tours/cover", "vehicles")
 * @param allowedFormats - Optional array of allowed formats ['jpg', 'png', 'jpeg']
 */
export const cloudinaryUpload = (
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
