import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import { updateUserRoleSchema, userIdParamSchema } from "../schema";

// get all user
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        profileImage: true,
        role: true,
        createdAt: true,
      },
    });
    next({ status: 200, success: true, data: { users } });
  } catch (error) {
    console.error("Get users error:", error);
    next({ status: 500, success: false, message: "Internal server error!" });
  }
};

// get user by id
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
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
    console.error("Update role error:", error);
    next({
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// update user role
const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = updateUserRoleSchema.parse(req.body);
    const { userId } = userIdParamSchema.parse(req.params);

    // Cannot change own role
    if (req.id === userId) {
      next({
        status: 400,
        success: false,
        message: "Cannot change your own role",
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
    next({
      status: 200,
      success: true,
      message: "User role updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update role error:", error);
    next({ status: 500, success: false, message: "Internal server error" });
  }
};
// delete user
const blockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return next({ status: 400, success: false, message: "User not found!" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true, isActive: false },
    });
    next({ status: 200, success: true, message: "User blocked succesfully!" });
  } catch (error) {
    console.error("Update role error:", error);
    next({ status: 500, success: false, message: "Internal server error" });
  }
};

export { getAllUsers, getUserById, updateUserRole, blockUser };
