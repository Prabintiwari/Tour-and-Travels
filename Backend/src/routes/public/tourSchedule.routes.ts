import { Router } from "express";
import {  getAvailableSchedules, getTourScheduleById, getTourSchedules } from "../../controllers/tourSchedule.controller";
const router = Router();

router.get("/",getTourSchedules)
router.get("/:tourScheduleId",getTourScheduleById)

router.get("/available/:tourId",getAvailableSchedules)

export default router;
