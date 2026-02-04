import Router from "express";

import { uploadFile } from "../../utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";
import {
  createNewCardController,
  createProfileController,
  editProfileController,
  editStatusController,
  getAllProfileController,
  getApprovedController,
  getDetailsProfileController,
  getOneProfileController,
  getRejectController,
} from "./controller";

const router = Router();
router.post("/profile", authenticate, uploadFile("profile", true, ["image"]), valResult, createProfileController);
router.put("/profile/:id", authenticate, uploadFile("profile", true, ["image"]), valResult, editProfileController);
router.put("/new-card", authenticate, uploadFile("profile-file", true, ["file"]), createNewCardController);
router.get("/profile", authenticate, getAllProfileController);
router.get("/approved-profile", authenticate, getApprovedController);
router.get("/rejected-profile", authenticate, getRejectController);

router.put("/profile-status/:id", authenticate, editStatusController);

router.get("/detail-profile/:id", authenticate, getDetailsProfileController);
router.get("/approved", authenticate, getAllProfileController);
router.get("/profile/:id", getOneProfileController);

export default router;
