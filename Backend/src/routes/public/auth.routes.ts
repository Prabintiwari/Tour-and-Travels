import { Router } from "express";
import { validate } from "../../middleware/validate";
import {
  loginSchema,
  registerSchema,
  userIdParamSchema,
  userResponseSchema,
} from "../../schema";
import {
  deleteUser,
  getMe,
  login,
  logout,
  register,
  verifyRegistration,
} from "../../controllers/auth.controller";
import { authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import z from "zod";
import {
  badRequestErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();

// Auth Routes

router.post("/register", validate(registerSchema), register);

router.post("/verify-register", verifyRegistration);

router.post("/login", validate(loginSchema), login);

router.post("/logout", authenticateToken, logout);

router.get("/my-profile", authenticateToken, getMe);

router.delete("/:id", authenticateToken, deleteUser);

// Swagger registration

// register
registerRoute({
  method: "post",
  path: "/api/auth/register",
  summary: "Register a new user",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: {
    201: {
      description: "User registered",
      content: { "application/json": { schema: userResponseSchema } },
    },
    403: errorResponse(badRequestErrorSchema, "Invalid credentials"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// verify-register
registerRoute({
  method: "post",
  path: "/api/auth/verify-register",
  summary: "Verify user registration",
  tags: ["Auth"],
  responses: {
    200: { description: "Verified successfully" },
    403: errorResponse(badRequestErrorSchema, "Invalid credentials"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// login
registerRoute({
  method: "post",
  path: "/api/auth/login",
  summary: "Login user",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: userResponseSchema } },
    },
    403: errorResponse(badRequestErrorSchema, "Invalid credentials"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// logout
registerRoute({
  method: "post",
  path: "/api/auth/logout",
  summary: "Logout user",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Logout successful" },
    403: errorResponse(forbiddenErrorSchema, "Access denied"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// my-profile
registerRoute({
  method: "get",
  path: "/api/auth/my-profile",
  summary: "Get user Profile",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
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

//delete account
registerRoute({
  method: "delete",
  path: "/api/auth/:id",
  summary: "Delete user",
  tags: ["Auth"],
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

export default router;
