import { Router } from "express";
// import { authenticate } from "src/utils/jwt";
import { getAllFolderController } from "./controller";

const router = Router();

router.get("/folder", getAllFolderController);

export default router;