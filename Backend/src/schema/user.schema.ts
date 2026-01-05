import z from "zod";
import { UserRole } from "@prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const updateUserSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),

    phone: z
      .string()
      .regex(/^[0-9]{7,15}$/, "Invalid phone number")
      .optional(),

    profileImage: z
      .string()
      .url("Profile image must be a valid URL")
      .optional(),

    address: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),

    dateOfBirth: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Date must be in YYYY-MM-DD format",
      }),
  })
  .openapi("UpdateUserRequest");

const updateUserRoleSchema = z
  .object({
    role: z.nativeEnum(UserRole),
  })
  .openapi("UpdateUserRoleRequest");

const userResponseSchema = z
  .object({
    id: z.string().openapi({ example: "user_123abc" }),
    fullName: z.string().openapi({ example: "John Doe" }),
    email: z.string().email().openapi({ example: "john@example.com" }),
    phone: z.string().nullable().openapi({ example: "9779841234567" }),
    role: z.nativeEnum(UserRole).openapi({ example: UserRole.USER }),
    isBlocked: z.boolean().openapi({ example: false }),
    token: z.string().optional().openapi({ example: "jwt-token-here" }),
    createdAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-15T10:30:00Z" }),
  })
  .openapi("UserResponse");

const userListResponseSchema =
  paginatedResponse(userResponseSchema).openapi("UsersListResponse");

const updateUserResponseSchema = z
  .object({
    id: z.string().openapi({ example: "user_123abc" }),
    fullName: z.string().openapi({ example: "John Doe" }),
    phone: z.string().nullable().openapi({ example: "9779841234567" }),
    profileImage: z
      .string()
      .nullable()
      .openapi({ example: "https://example.com/profile.jpg" }),
    address: z.string().nullable().openapi({ example: "123 Main St" }),
    street: z.string().nullable().openapi({ example: "Downtown" }),
    city: z.string().nullable().openapi({ example: "Kathmandu" }),
    country: z.string().nullable().openapi({ example: "Nepal" }),
    dateOfBirth: z.string().nullable().openapi({ example: "1990-01-01" }),
    role: z.nativeEnum(UserRole).openapi({ example: UserRole.USER }),
    createdAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-15T10:30:00Z" }),
  })
  .openapi("UpdateUserResponse");

const updateUserRoleResponseSchema = z
  .object({
    id: z.string().openapi({ example: "user_123abc" }),
    role: z.nativeEnum(UserRole).openapi({ example: UserRole.ADMIN }),
    updatedAt: z.string().openapi({ example: "2024-01-15T10:30:00Z" }),
  })
  .openapi("UpdateUserRoleResponse");

const blockUserResponseSchema = z
  .object({
    id: z.string().openapi({ example: "user_123abc" }),
    isBlocked: z.boolean().openapi({ example: true }),
    updatedAt: z.string().openapi({ example: "2024-01-15T10:30:00Z" }),
  })
  .openapi("BlockUserResponse");

const userIdParamSchema = z.object({
  userId: z.string().min(1).openapi({ example: "user_123abc" }),
});

type UserIdParamSchema = z.infer<typeof userIdParamSchema>;

export {
  updateUserSchema,
  updateUserRoleSchema,
  userResponseSchema,
  userListResponseSchema,
  updateUserResponseSchema,
  updateUserRoleResponseSchema,
  blockUserResponseSchema,
  userIdParamSchema,
  UserIdParamSchema,
};
