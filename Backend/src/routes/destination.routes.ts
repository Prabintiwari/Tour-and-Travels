import { Router } from "express";
import { getAllDestinations, getAllRegions, getDestinationById, getPopularDestinations } from "../controllers/destination.controller";

const router = Router();

router.get('/',getAllDestinations)
router.get('/:id',getDestinationById)
router.get('/regions',getAllRegions)

router.get('/popular-destination',getPopularDestinations)


export default router;
