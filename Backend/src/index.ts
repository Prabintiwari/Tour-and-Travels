import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import responseHandler from "./middleware/responseHandler";
import helmet from "helmet";
dotenv.config();
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./config/swagger";
import userRoute from "./routes/public/user.routes";
import authRoute from "./routes/public/auth.routes";
import adminRoute from "./routes/admin";
import destinationRoute from "./routes/public/destination.routes";
import tourRoute from "./routes/public/tour.routes";
import destinationGalleryRoute from "./routes/public/destination.gallery.routes.";
import itineraryRoute from "./routes/public/itinerary.routes";
import tourScheduleRoute from "./routes/public/tourSchedule.routes";
import tourBookingRoute from "./routes/public/tourBooking.routes";

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
const openApiDocument = generateOpenApiDocument();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

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
