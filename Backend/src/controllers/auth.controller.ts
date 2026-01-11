import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema, userIdParamSchema } from "../schema";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import generateOTP from "../utils/generateOtp";
import { transporter } from "../utils/emailServices";
import registration_otp_templete from "../templets/userEmailTemplet/registration_otp";
import { AuthRequest, generateToken } from "../middleware/auth";
import welcomeEmail from "../templets/userEmailTemplet/WelcomeEmail";

// user register
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    let tempUser;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (existingUser) {
      return next({
        status: 400,
        success: false,
        message: "User already exist!!",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const date = new Date();
    date.setMinutes(date.getMinutes() + 10);
    const otp = generateOTP();

    const existinguser = await prisma.tempUser.findFirst({
      where: { email: validatedData.email },
    });
    if (existinguser) {
      tempUser = await prisma.tempUser.update({
        where: { email: validatedData.email },
        data: { otp: otp, expiry: date },
      });
    } else {
      tempUser = await prisma.tempUser.create({
        data: {
          email: validatedData.email,
          fullName: validatedData.fullName,
          password: hashedPassword,
          otp: otp,
          expiry: date,
        },
      });
    }
    await transporter.sendMail({
      from: `"Tour & Travels Teams" <${process.env.SMTP_USER}>`,
      to: `${validatedData.email}`,
      subject: "Your registration OTP!",
      text: "Here is your registration OTP!",
      html: registration_otp_templete(otp, validatedData.fullName),
    });
    next({
      status: 200,
      success: true,
      message: `otp sends successfully to ${validatedData.email}`,
      data: { email: validatedData.email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    next({ status: 500, success: false, message: "internal server error" });
  }
};

// user register verification
const verifyRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return next({
        status: 400,
        success: false,
        message: "Email and otp is required!",
      });
    }
    console.log(otp);
    // Check if user exists
    const existingTempUser = await prisma.tempUser.findUnique({
      where: { email },
    });
    if (!existingTempUser) {
      return next({
        status: 400,
        success: false,
        message: "Email not found! Please register first",
      });
    }
    const date = new Date();
    if (otp !== existingTempUser.otp) {
      next({ status: 401, success: false, message: "invalid OTP!!" });
      return;
    }
    if (date > existingTempUser.expiry) {
      next({
        status: 400,
        success: false,
        message: "OTP has expired please send again!!",
      });

      return;
    }
    // Create user
    const user = await prisma.user.create({
      data: {
        email: existingTempUser.email,
        fullName: existingTempUser.fullName,
        password: existingTempUser.password,
        profileImage: process.env.DEFAULT_PROFILE_IMAGE,
      },
    });
    await prisma.tempUser.delete({ where: { email: existingTempUser.email } });

    // Generate token
    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    await transporter.sendMail({
      from: `"Tour & Travels Teams" <${process.env.SMTP_USER}>`,
      to: `${email}`,
      subject: "Welcome to our community!",
      text: "Welcome to our community!",
      html: welcomeEmail(user.fullName),
    });
    next({
      status: 200,
      success: true,
      message: "User created successfully",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          userName: user.fullName,
          image: user.profileImage,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    next({ status: 500, success: false, message: "internal server error" });
  }
};

// user login
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
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
      user.password
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
  } catch (error) {
    console.error("Login error:", error);
    next({ status: 500, success: false, message: "Internal server error!" });
  }
};

// my profile
const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
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
  } catch (error) {
    next({ status: 500, success: false, message: "Failed to fetch user data" });
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
  } catch (error) {
    console.error("Update role error:", error);
    next({ status: 500, success: false, message: "Internal server error" });
  }
};

export { register, verifyRegistration, login, getMe, logout, deleteUser };
