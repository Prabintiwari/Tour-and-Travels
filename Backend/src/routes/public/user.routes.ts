import { Router } from "express";
import { validate } from "../../middleware/validate";
import {
  forgotPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  updateUserResponseSchema,
  updateUserSchema,
  userIdParamSchema,
  verifyOtpSchema,
} from "../../schema";
import { authenticateToken } from "../../middleware/auth";
import { cloudinaryUpload } from "../../middleware/upload";
import {
  forgotPassword,
  resendOtp,
  resetPassword,
  updateUserDetails,
  verifyOtp,
} from "../../controllers/user.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  badRequestErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();

router.patch(
  "/users/update-profile/:userId",
  cloudinaryUpload("users/profile").single("profileImage"),
  authenticateToken,
  validate.params(userIdParamSchema),
  validate.body(updateUserSchema),
  updateUserDetails
);

router.post("/forgot-password", forgotPassword);

router.post("/resend-otp", resendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/reset-password", resetPassword);

// Swagger registration

// update user details
registerRoute({
  method: "patch",
  path: "/api/users/update-profile/{userId}",
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

// Forget password
registerRoute({
  method: "post",
  path: "/api/users/forgot-password",
  summary: "Send OTP for password reset",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: forgotPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP sent successfully",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Resend Otp
registerRoute({
  method: "post",
  path: "/api/users/resend-otp",
  summary: "Resend OTP",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: resendOtpSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "OTP resent successfully" },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Verify-otp
registerRoute({
  method: "post",
  path: "/api/users/verify-otp",
  summary: "Verify OTP",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: verifyOtpSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "OTP verified successfully" },
    400: errorResponse(badRequestErrorSchema, "Invalid OTP"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Reset password
registerRoute({
  method: "post",
  path: "/api/users/reset-password",
  summary: "Reset password",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Password reset successful" },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    404: errorResponse(notFoundErrorSchema, "User not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
