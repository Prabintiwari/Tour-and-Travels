import { NextFunction, Response, Request } from "express";

const responseHandler = (
  response: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (response.success) {
      return res.status(response.status || 200).json({
        success: true,
        message: response.message,
        data: response.data,
      });
    }

    return res.status(response.status).json({
      success: false,
      message: response.message,
      error: response.error,
      data: response.data,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(response.status).json({
      success: false,
      message: error.message || "Internal server error",
      error: response.error,
    });
  }
};

export default responseHandler;
