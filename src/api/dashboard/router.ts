import { Router } from "express";
import { getAggregationChartProfileController, getAggregationProfileController } from "./controller";
const router = Router();

router.get("/profile-chart", getAggregationChartProfileController);

router.get("/profile-aggregation", getAggregationProfileController);

export default router;