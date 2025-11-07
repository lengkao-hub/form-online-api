import Router from "express";

import { uploadFiles } from "../../utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";
import {
  createProfileController,
  editProfileController,
  editStatusController,
  getAllProfileController,
  getOneProfileController,
} from "./controller";

const router = Router();

router.get("/profile/:id", getOneProfileController);
router.post("/profile", authenticate, uploadFiles("profile", true, ["image", "oldImage"]), valResult, createProfileController);
router.put("/profile/:id", authenticate, uploadFiles("profile", true, ["image", "oldImage"]), valResult, editProfileController);
router.put("/profile-status/:id", authenticate, editStatusController);
router.get("/approved", authenticate, getAllProfileController);

export default router;
