import Router from "express";

import { uploadFiles } from "../../utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";
import {
  createProfileController,
  editProfileController,
  getAllProfileController,
  getApprovedController,
} from "./controller";

const router = Router();

// router.get("/profile-of-customer/:id", getOneProfileController);
router.post("/profile-of-customer", authenticate, uploadFiles({ directory: "profile", separateByDate: true, allowDynamicFields: true }), valResult, createProfileController);
router.put("/profile-of-customer/:id", authenticate, uploadFiles({ directory: "profile", separateByDate: true, allowDynamicFields: true }), valResult, editProfileController);
router.get("/profile-of-customer", authenticate, getAllProfileController);
router.get("/approved-user", authenticate, getApprovedController);

export default router;
