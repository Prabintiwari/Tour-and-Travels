import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin tour review routes

// Swagger registration

export default router;
