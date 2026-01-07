// middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = {
  body: (schema: ZodObject) => validateMiddleware("body", schema),
  query: (schema: ZodObject) => validateMiddleware("query", schema),
  params: (schema: ZodObject) => validateMiddleware("params", schema),
};

function validateMiddleware(
  type: "body" | "query" | "params",
  schema: ZodObject
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}
