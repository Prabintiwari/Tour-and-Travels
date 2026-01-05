import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";
extendZodWithOpenApi(z);

export const paginatedResponse = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: z.array(schema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

export const errorResponse = (schema: z.ZodTypeAny, description: string) => ({
  description,
  content: {
    "application/json": {
      schema,
    },
  },
});

const baseErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export const notFoundErrorSchema = baseErrorSchema.extend({
  error: z.string().openapi({ example: "Not Found" }),
  message: z.string().openapi({ example: "Not found" }),
  statusCode: z.number().openapi({ example: 404 }),
});

export const unauthorizedErrorSchema = baseErrorSchema.extend({
  error: z.string().openapi({ example: "Unauthorized" }),
  message: z.string().openapi({ example: "You must login" }),
  statusCode: z.number().openapi({ example: 401 }),
});
export const internalServerErrorSchema = baseErrorSchema.extend({
    error: z.string().openapi({ example: "Internal Server Error" }),
    message: z.string().openapi({ example: "Something went wrong" }),
    statusCode: z.number().openapi({ example: 500 }),
});

export const badRequestErrorSchema = baseErrorSchema.extend({
    error: z.string().openapi({ example: "Bad Request" }),
    message: z.string().openapi({ example: "Invalid input provided" }),
    statusCode: z.number().openapi({ example: 400 }),
});

export const forbiddenErrorSchema = baseErrorSchema.extend({
    error: z.string().openapi({ example: "Forbidden" }),
    message: z.string().openapi({ example: "Access denied" }),
    statusCode: z.number().openapi({ example: 403 }),
});

export const conflictErrorSchema = baseErrorSchema.extend({
    error: z.string().openapi({ example: "Conflict" }),
    message: z.string().openapi({ example: "Resource already exists" }),
    statusCode: z.number().openapi({ example: 409 }),
});

export const unprocessableEntityErrorSchema = baseErrorSchema.extend({
    error: z.string().openapi({ example: "Unprocessable Entity" }),
    message: z.string().openapi({ example: "Validation failed" }),
    statusCode: z.number().openapi({ example: 422 }),
});