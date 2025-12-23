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
      data: response.data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default responseHandler;
