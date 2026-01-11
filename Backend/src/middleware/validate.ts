
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateRequest = (schema: z.ZodType<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error:any) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errorMessages
        });
      }

      next({status:400,success:false,message:error.message})
    }
  };
};

// For query and params - validate and let controller access
export const validateQuery = (schema: z.ZodType<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Just validate, don't modify req.query
      await schema.parseAsync(req.query);
      next();
    } catch (error:any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      next({status:400,success:false,message:error.message})
    }
  };
};

export const validateParams = (schema: z.ZodType<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Just validate, don't modify req.params
      await schema.parseAsync(req.params);
      next();
    } catch (error:any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      next({status:400,success:false,message:error.message})
    }
  };
};