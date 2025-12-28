import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import generateOTP from "../utils/generateOtp";
import { transporter } from "../utils/emailServices";
import Password_Reset_OTP from "../templets/userEmailTemplet/forgot_password_otp";
import passwordResetSuccessEmail from "../templets/userEmailTemplet/passwordResetSuccessfully";
import { updateUserSchema } from "../utils/zod";

// update user details
const updateUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;

    const validatedData = updateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return next({
        status: 404,
        success: false,
        message: "User not found!",
      });
    }

    // image already uploaded by multer-cloudinary
    const imageUrl = req.file?.path;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        profileImage: imageUrl ?? existingUser.profileImage,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        profileImage: true,
        address: true,
        role: true,
      },
    });

    return next({
      status: 200,
      success: true,
      message: "User details updated successfully!",
      data: { user },
    });
  } catch (error: any) {
    console.error(error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error!",
    });
  }
};
// forgot password
const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next({
        status: 400,
        success: false,
        message: "Email is required!",
      });
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!existingUser) {
      return next({
        status: 400,
        success: false,
        message: "User not  found!",
      });
    }
    const date = new Date();
    date.setMinutes(date.getMinutes() + 10);
    const otp = generateOTP();

    const tempUser = await prisma.tempUser.findUnique({
      where: { email: email },
    });
    if (tempUser) {
      await prisma.tempUser.update({
        where: { email: email },
        data: { otp: otp, expiry: date },
      });
    } else {
      await prisma.tempUser.create({
        data: {
          fullName: existingUser.fullName,
          email: existingUser.email,
          password: existingUser.password,
          otp: otp,
          expiry: date,
        },
      });
    }
    next({
      status: 200,
      success: true,
      message: `otp sends successfully to ${email}`,
      data: { expiry: tempUser?.expiry },
    });
    await transporter.sendMail({
      from: `"Tour & Travels Teams" <${process.env.SMTP_USER}>`,
      to: `${email}`,
      subject: "Your reset password OTP!",
      text: "Here is your reset password OTP!",
      html: Password_Reset_OTP(otp, existingUser.fullName),
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "internal server error",
    });
  }
};
// resend otp through email
const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    let tempUser;
    if (!email) {
      return next({
        status: 400,
        success: false,
        message: "Email is required!",
      });
    }
    const existingTempUser = await prisma.tempUser.findUnique({
      where: { email: email },
    });
    if (!existingTempUser) {
      return next({
        status: 400,
        success: false,
        message: "Email not found! Please register first",
      });
    }
    const date = new Date();
    date.setMinutes(date.getMinutes() + 10);
    const otp = generateOTP();
    if (existingTempUser) {
      tempUser = await prisma.tempUser.update({
        where: { email: email },
        data: { otp: otp, expiry: date },
      });
    }
    next({
      status: 200,
      success: true,
      message: `otp sends successfully to ${email}`,
      data: { expiry: tempUser?.expiry },
    });

    await transporter.sendMail({
      from: `"Tour & Travels Teams" <${process.env.SMTP_USER}>`,
      to: `${email}`,
      subject: "Your reset password OTP!",
      text: "Here is your reset password OTP!",
      html: Password_Reset_OTP(otp, existingTempUser.fullName),
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "internal server error",
    });
  }
};
// verify otp
const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return next({
        status: 500,
        success: false,
        message: "internal server error",
      });
    }
    // Check if user exists
    const existingTempUser = await prisma.tempUser.findUnique({
      where: { email },
    });
    if (!existingTempUser) {
      return next({
        status: 400,
        success: false,
        message: "Email not found!",
      });
    }
    const date = new Date();
    if (otp !== existingTempUser.otp) {
      next({
        status: 401,
        success: false,
        message: "invalid OTP!!",
      });

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
    await prisma.tempUser.delete({ where: { email: existingTempUser.email } });
    next({
      status: 200,
      success: true,
      message: "OTP verified successfully!",
      data: {
        email: existingTempUser.email,
        verified: true,
      },
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "internal server error",
    });
  }
};
// reset password
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return next({
        status: 400,
        success: false,
        message: "Email and newPassword is required!",
      });
    }
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      next({
        status: 400,
        success: false,
        message: "User doesnt exist",
      });

      return;
    }
    const PasswordMatch = await bcrypt.compare(newPassword, user.password);
    if (PasswordMatch) {
      next({
        status: 401,
        success: false,
        message: "new password cannot be same as previous!!",
      });

      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });
    next({
      status: 200,
      success: true,
      message: "Password reset successfully!",
      data: { updatedUser },
    });
    await transporter.sendMail({
      from: `"Tour & Travels Teams" <${process.env.SMTP_USER}>`,
      to: `${email}`,
      subject: "Password Changed Successfully",
      text: "Your password has been changed successfully!",
      html: passwordResetSuccessEmail(user.fullName),
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "internal server error!!",
    });
  }
};

export {
    updateUserDetails,
    forgotPassword,
    resendOtp,
    verifyOtp,
    resetPassword,
};