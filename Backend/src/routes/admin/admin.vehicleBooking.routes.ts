import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";

const router = Router()

router.use(authenticateToken,AdminOnly)

// Admin vehicle booking routes


// Swagger registration


export default router