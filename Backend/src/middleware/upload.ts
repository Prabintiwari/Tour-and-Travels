import multer from "multer";
import crypto from "crypto";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import connectCloudinary from "../config/cloudinary";
import { FILE_LIMITS } from "../config/constants/image.constants";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

const imageFileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Only image files (jpg, png, webp) are allowed"
      )
    );
  }
  cb(null, true);
};

const createMulter = (storage: any) =>
  multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: FILE_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024,
    },
  });

const cloudinaryUpload = (folderName: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async () => ({
      folder: folderName,
      allowed_formats: ALLOWED_FORMATS,
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    }),
  });

  return createMulter(storage);
};

const cloudinaryUploadFromParams = (
  baseFolderName: string,
  paramName: string
) => {
  const storage = new CloudinaryStorage({
    cloudinary: connectCloudinary,
    params: async (req) => {
      const id = req.params[paramName];
      if (!id) throw new Error(`Missing param ${paramName}`);

      return {
        folder: `${baseFolderName}/${id}`,
        allowed_formats: ALLOWED_FORMATS,
        public_id: crypto.randomUUID(),
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      };
    },
  });

  return createMulter(storage);
};

const cleanupCloudinary = async (publicIds: string[]) => {
  await Promise.all(
    publicIds.map((id) =>
      connectCloudinary.uploader
        .destroy(id)
        .catch((error) => console.error(`Failed to cleanup ${id}:`, error))
    )
  );
};

export { cloudinaryUpload, cloudinaryUploadFromParams, cleanupCloudinary };
