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
import { validate } from "../../middleware/validate";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../../controllers/admin.controller";
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

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin user routes

router.patch(
  "/update-profile/:id",
  cloudinaryUpload("users/profile").single("profileImage"),
  validate(updateUserSchema),
  updateUserDetails
);

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.delete("/:id", deleteUser);

router.patch("/block/:id", blockUser);

router.patch("/:id/role", validate(updateUserRoleSchema), updateUserRole);


// Swagger registration

// update user details
registerRoute({
  method: "patch",
  path: "/api/admin/users/:id",
  summary: "Update user info",
  tags: ["Users"],
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        "application/json": {
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
  path: "/api/admin/users/:id",
  summary: "Get user by ID",
  tags: ["Users"],
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
  path: "/api/admin/users/:id",
  summary: "Delete user",
  tags: ["Users"],
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
  path: "/api/admin/users/:id/role",
  summary: "Update user role",
  tags: ["Users"],
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
  path: "/api/admin/users/block/:id",
  summary: "Block a user",
  tags: ["Users"],
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
