import { Router } from "express";
import {
  getAvailableSchedules,
  getTourScheduleById,
  getTourSchedules,
} from "../../controllers/tourSchedule.controller";
import { validate } from "../../middleware/validate";
import {
  tourParamsSchema,
  tourScheduleIdParamSchema,
  tourScheduleQuerySchema,
} from "../../schema";
const router = Router();

router.get("/", validate.query(tourScheduleQuerySchema), getTourSchedules);
router.get(
  "/available/:tourId",
  validate.params(tourParamsSchema),
  getAvailableSchedules
);
router.get(
  "/:tourScheduleId",
  validate.params(tourScheduleIdParamSchema),
  getTourScheduleById
);

export default router;
