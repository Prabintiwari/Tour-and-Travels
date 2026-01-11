import { Router } from "express";
import { updateUserDetails } from "../../controllers/user.controller";
import {
  blockUserResponseSchema,
  updateUserResponseSchema,
  updateUserRoleResponseSchema,
  updateUserRoleSchema,
  updateUserSchema,
  userIdParamSchema,
  userListResponseSchema,
  userResponseSchema,
} from "../../schema";
import { cloudinaryUpload } from "../../middleware/upload";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../../controllers/admin.user.controller";
import { deleteUser } from "../../controllers/auth.controller";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import {
  badRequestErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { registerRoute } from "../../utils/openapi.utils";
import z from "zod";
import { validateParams, validateRequest } from "../../middleware/validate";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin user routes

router.patch(
  "/update-profile/:userId",
  cloudinaryUpload("users/profile").single("profileImage"),
  validateParams(userIdParamSchema),
  validateRequest(updateUserSchema),
  updateUserDetails
);

router.get("/", getAllUsers);

router.get("/:userId", validateParams(userIdParamSchema), getUserById);

router.delete("/:userId", validateParams(userIdParamSchema), deleteUser);

router.patch("/block/:userId", validateParams(userIdParamSchema), blockUser);

router.patch(
  "/:id/role",
  validateParams(userIdParamSchema),
  validateRequest(updateUserRoleSchema),
  updateUserRole
);

// Swagger registration

// update user details
registerRoute({
  method: "patch",
  path: "/api/admin/users/{userId}",
  summary: "Update user info",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User info updated successfully",
      content: {
        "application/json": {
          schema: updateUserResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get all user
registerRoute({
  method: "get",
  path: "/api/admin/users",
  summary: "Get all users",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List of users",
      content: {
        "application/json": {
          schema: userListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get user by id
registerRoute({
  method: "get",
  path: "/api/admin/users/{userId}",
  summary: "Get user by ID",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: { params: userIdParamSchema },
  responses: {
    200: {
      description: "User found",
      content: { "application/json": { schema: userResponseSchema } },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete user
registerRoute({
  method: "delete",
  path: "/api/admin/users/{userId}",
  summary: "Delete user",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: { params: userIdParamSchema },
  responses: {
    200: {
      description: "User deleted",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// update user role
registerRoute({
  method: "patch",
  path: "/api/admin/users/{userId}/role",
  summary: "Update user role",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateUserRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User role updated successfully",
      content: {
        "application/json": {
          schema: updateUserRoleResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Block user
registerRoute({
  method: "patch",
  path: "/api/admin/users/block/{userId}",
  summary: "Block a user",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: { params: userIdParamSchema },
  responses: {
    200: {
      description: "User blocked successfully",
      content: {
        "application/json": {
          schema: blockUserResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
