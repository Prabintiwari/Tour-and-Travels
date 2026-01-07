import { Router } from "express";

import { validate } from "../../middleware/validate";

import {
  createTourScheduleSchema,
  tourScheduleIdParamSchema,
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
router.post("/", validate.body(createTourScheduleSchema), createTourSchedule);
router.patch(
  "/:tourScheduleId",
  validate.params(tourScheduleIdParamSchema),
  validate.body(updateTourScheduleSchema),
  updateTourSchedule
);

router.delete(
  "/:tourScheduleId",
  validate.params(tourScheduleIdParamSchema),
  deleteTourSchedule
);

export default router;
