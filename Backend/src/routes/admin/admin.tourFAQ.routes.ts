import { Router } from "express";
import { validate } from "../../middleware/validate";
import { createTourFAQSchema, tourFAQResponseSchema } from "../../schema";
import { createFAQ } from "../../controllers/tourFAQ.controller";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();
router.use(authenticateToken, AdminOnly);

// Admin FAQ routes

router.post("/", validate.body(createTourFAQSchema), createFAQ);

// Swagger registration

// Create a new tour faqs
registerRoute({
  method: "post",
  path: "/api/admin/Faqs",
  summary: "Create a new tour faqs",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createTourFAQSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour Faqs created",
      content: {
        "application/json": { schema: tourFAQResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
