import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import responseHandler from "./middleware/responseHandler";
import helmet from "helmet";
dotenv.config();
import {swaggerUi,swaggerSpec} from "./config/swagger"
import userRoute from "./routes/user.routes";
import authRoute from "./routes/auth.routes";
import adminRoute from "./routes/admin.routes";
import destinationRoute from "./routes/destination.routes";
import tourRoute from "./routes/tour.routes";
import destinationGalleryRoute from "./routes/destination.gallery.routes.";
import itineraryRoute from "./routes/itinerary.routes";
import tourScheduleRoute from "./routes/tourSchedule.routes";
import tourBookingRoute from "./routes/tourBooking.routes";


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint
 *     responses:
 *       200:
 *         description: Success
 */

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/destinations", destinationRoute);
app.use("/api/destination-gallery", destinationGalleryRoute);
app.use("/api/tour", tourRoute);
app.use("/api/itinerary", itineraryRoute);
app.use("/api/tour-schedule", tourScheduleRoute);
app.use("/api/tour-booking", tourBookingRoute);
app.use(responseHandler);

app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
