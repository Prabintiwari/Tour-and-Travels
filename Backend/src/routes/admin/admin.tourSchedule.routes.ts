import { Router } from "express";

import { validate } from "../../middleware/validate";

import {
  createTourScheduleSchema,
  updateTourScheduleSchema,
} from "../../schema";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import {
  createTourSchedule,
  deleteTourSchedule,
  updateTourSchedule,
} from "../../controllers/tourSchedule.controller";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Tour Schedule API
router.post(
  "/",
  validate(createTourScheduleSchema),
  createTourSchedule
);
router.patch(
  "/:tourScheduleId",
  validate(updateTourScheduleSchema),
  updateTourSchedule
);

router.delete("/:tourScheduleId", deleteTourSchedule);

export default router;
