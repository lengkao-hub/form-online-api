import Router from "express";
import { authenticate } from "../../utils/jwt";
import { createPositionController, getAllProfileController, getCheckBlacklistController } from "./controller";

const router = Router();

router.get("/backlist-check", authenticate, getCheckBlacklistController);
router.get("/backlist", authenticate, getAllProfileController);
router.post("/backlist", authenticate, createPositionController);

export default router;
