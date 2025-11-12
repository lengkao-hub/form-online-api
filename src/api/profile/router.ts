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
router.post("/profile", authenticate, uploadFiles({ directory: "profile", separateByDate: true, allowDynamicFields: true }), valResult, createProfileController);
router.put("/profile/:id", authenticate, uploadFiles({ directory: "profile", separateByDate: true, allowDynamicFields: true }), valResult, editProfileController);
router.put("/profile-status/:id", authenticate, editStatusController);
router.get("/approved", authenticate, getAllProfileController);

export default router;
