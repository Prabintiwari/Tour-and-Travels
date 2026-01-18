import { Request, Response, NextFunction } from "express";
import {
  loginSchema,
  registerSchema,
  userIdParamSchema,
  verifyRegistrationSchema,
} from "../schema";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import generateOTP from "../utils/generateOtp";
import { transporter } from "../services/emailServices";
import registration_otp_templete from "../templets/userEmailTemplet/registration_otp";
import { AuthRequest, generateToken } from "../middleware/auth";
import welcomeEmail from "../templets/userEmailTemplet/WelcomeEmail";
import { ZodError } from "zod";

// user register
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const normalizedEmail = validatedData.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return next({
        status: 400,
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    const otp = generateOTP();

    const tempUser = await prisma.tempUser.upsert({
      where: { email: normalizedEmail },
      update: {
        otp,
        expiry,
        fullName: validatedData.fullName,
        password: hashedPassword,
      },
      create: {
        email: normalizedEmail,
        fullName: validatedData.fullName,
        password: hashedPassword,
        otp,
        expiry,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Tour & Travels Team" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: "Your registration OTP",
        html: registration_otp_templete(otp, validatedData.fullName),
      });
    } catch (err) {
      await prisma.tempUser.delete({ where: { email: normalizedEmail } });
      throw err;
    }

    next({
      status: 201,
      success: true,
      message: "OTP sent successfully",
      data: { normalizedEmail },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues,
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// user register verification
const verifyRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = verifyRegistrationSchema.parse(req.body);

    const normalizedEmail = email.toLowerCase();

    const tempUser = await prisma.tempUser.findUnique({
      where: { email: normalizedEmail },
    });
    if (!tempUser) {
      return next({
        status: 400,
        success: false,
        message: "Please register first",
      });
    }

    if (new Date() > tempUser.expiry) {
      return next({ status: 400, success: false, message: "OTP expired" });
    }

    if (String(otp) !== String(tempUser.otp)) {
      return next({ status: 401, success: false, message: "Invalid OTP" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      await prisma.tempUser.delete({ where: { email: normalizedEmail } });
      return next({
        status: 409,
        success: false,
        message: "User already verified",
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: tempUser.email,
          fullName: tempUser.fullName,
          password: tempUser.password,
          profileImage: process.env.DEFAULT_PROFILE_IMAGE,
        },
      });

      await tx.tempUser.delete({ where: { email: normalizedEmail } });
      return createdUser;
    });

    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    try {
      await transporter.sendMail({
        from: `"Tour & Travels Team" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: "Welcome!",
        html: welcomeEmail(user.fullName),
      });
    } catch (e) {
      console.warn("Welcome email failed", e);
    }

    next({
      status: 201,
      success: true,
      message: "User verified successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.profileImage,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues,
      });
    }
    console.error("Verify registration error:", error);
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// user login
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const email = validatedData.email.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      return next({
        status: 400,
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      user.password,
    );
    if (!isValidPassword) {
      return next({
        status: 400,
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    next({
      status: 200,
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          userName: user.fullName,
          image: user.profileImage,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Login error:", error);
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error!",
    });
  }
};

// my profile
const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user) {
      return next({ status: 404, success: false, message: "User not found" });
    }

    next({ status: 200, success: true, data: { user } });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Failed to fetch user data",
    });
  }
};

// user logout
const logout = (req: Request, res: Response, next: NextFunction) => {
  res.clearCookie("token");
  next({ status: 200, success: true, message: "Logged out successfully" });
};

// delete user
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return next({ status: 400, success: false, message: "User not found!" });
    }
    await prisma.user.delete({
      where: { id: userId },
    });
    next({ status: 200, success: true, message: "User deleted succesfully!" });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Update role error:", error);
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export { register, verifyRegistration, login, getMe, logout, deleteUser };
