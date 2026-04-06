import { Router } from "express";
// import { authenticate } from "src/utils/jwt";
import { authenticate } from "../../utils/jwt";
import { getAllFolderController, getAllFolderControllers, getOneFolderControllers } from "./controller";

const router = Router();

router.get("/folder", authenticate, getAllFolderController);
router.get("/folders", getAllFolderControllers);
router.get("/folders/:id", getOneFolderControllers);
export default router;

