import { NextFunction, Request, Response } from "express";
import * as z from "zod";

const validate = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const prettifyError = error.flatten();
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: prettifyError.fieldErrors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unexpected error",
    });
  }
};
export { validate };
