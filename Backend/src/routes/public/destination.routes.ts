import { Router } from "express";
import { getAllDestinations, getAllRegions, getDestinationById, getDestinationStats, getPopularDestinations } from "../../controllers/destination.controller";

const router = Router();

router.get('/',getAllDestinations)
router.get('/popular-destination',getPopularDestinations)
router.get('/regions',getAllRegions)
router.get('/stats/:id',getDestinationStats)
router.get('/:id',getDestinationById)


export default router;
