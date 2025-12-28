import z from "zod";
import { UserRole } from "../types/user.types";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password too long"),
  fullName: z.string().min(2, "fullName must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),

  phone: z
    .string()
    .regex(/^[0-9]{7,15}$/, "Invalid phone number")
    .optional(),

  profileImage: z.string().url("Profile image must be a valid URL").optional(),

  address: z.string().optional(),

  street: z.string().optional(),

  city: z.string().optional(),

  country: z.string().optional(),

  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Date must be in YYYY-MM-DD format",
    }),
});

const updateUserRoleSchema = z.object({
  role: z.enum(UserRole),
});

const destinationSchema = z.object({
  name: z.string().min(1, "Name is required"),

  description: z.string().min(10, "Description must be at least 10 characters"),

  region: z.string().min(1, "Region is required"),

  location: z.string().min(1, "Location is required"),

  bestTimeToVisit: z.string().min(1, "Best time to visit is required"),

  attractions: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.string()).min(1)),
});


export {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateUserRoleSchema,
  destinationSchema
  ,
};
