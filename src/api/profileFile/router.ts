import { Router } from "express";

import { upload } from "src/utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { createProfileFileController } from "./controller";
const router = Router();

router.post("/profile-files/:id", authenticate, upload("profileFile", true).array("profileFile"), createProfileFileController);

export default router;