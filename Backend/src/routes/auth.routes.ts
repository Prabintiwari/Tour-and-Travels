import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../utils/zod";
import {
    deleteUser,
    getMe,
  login,
  logout,
  register,
  verifyRegistration,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// register
router.post("/register", validate(registerSchema), register);
router.post("/verify-register", verifyRegistration);
// Login
router.post("/login", validate(loginSchema), login);
// logout
router.post("/logout", authenticateToken, logout);
// get me
router.get("/my-profile", authenticateToken, getMe);
// delete my account
router.delete("/delete/:id", authenticateToken, deleteUser);

export default router;
