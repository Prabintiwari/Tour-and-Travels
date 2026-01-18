import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

const registerSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password too long"),
    fullName: z.string().min(2, "fullName must be at least 2 characters"),
  })
  .openapi("RegisterRequest");

const loginSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  })
  .openapi("LoginRequest");

const verifyRegistrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export { registerSchema, loginSchema, verifyRegistrationSchema };
