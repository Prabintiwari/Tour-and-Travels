import { Router } from "express";
import { getAllTours, getTourById } from "../controllers/tour.controller";

const router = Router();

router.get("/",getAllTours)
router.get("/:tourId",getTourById)

export default router;
