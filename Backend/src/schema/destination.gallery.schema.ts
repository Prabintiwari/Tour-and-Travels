import {z} from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const galleryImageSchema = z
  .object({
    publicId: z.string().openapi({
      example: "destination/gallery/dest_123abc/img_1",
    }),
    url: z.string().url().openapi({
      example: "https://res.cloudinary.com/demo/image/upload/img.jpg",
    }),
  })
  .openapi("GalleryImage");

const createOrUpdateGalleryRequestSchema = z
  .object({
    images: z.array(z.any()).openapi({
      type: "array",
      items: {
        type: "string",
        format: "binary",
      },
      description: "Up to 10 images (multipart/form-data)",
    }),
  })
  .openapi("CreateOrUpdateGalleryRequest");

const removeGalleryImagesSchema = z
  .object({
    publicIds: z
      .array(z.string())
      .min(1, "At least one image publicId is required")
      .openapi({
        example: [
          "destination/gallery/dest_123abc/img_1",
          "destination/gallery/dest_123abc/img_2",
        ],
      }),
  })
  .openapi("RemoveGalleryImagesRequest");

const destinationGalleryResponseSchema = z
  .object({
    id: z.string().openapi({ example: "gallery_123abc" }),
    destinationId: z.string().openapi({ example: "dest_123abc" }),
    images: z.array(galleryImageSchema),
    createdAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-02T10:00:00Z" }),
  })
  .openapi("DestinationGalleryResponse");

export {
  galleryImageSchema,
  createOrUpdateGalleryRequestSchema,
  removeGalleryImagesSchema,
  destinationGalleryResponseSchema,
};
