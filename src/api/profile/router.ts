import Router from "express";

import { upload, uploadFile } from "../../utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";
import {
  createNewCardController,
  createProfileController,
  editProfileController,
  editStatusController,
  getAllProfileController,
  getApprovedController,
  getCompopoxController,
  getDetailsProfileController,
  getOneProfileController,
  getRejectController,
} from "./controller";

const router = Router();
router.post("/profile", authenticate, uploadFile("profile", true, ["image"]), valResult, createProfileController);
router.put("/profile/:id", authenticate, uploadFile("profile", true, ["image"]), valResult, editProfileController);
// router.put("/new-card", authenticate, uploadFile("profile-file", true, ["file"]), createNewCardController);
router.put("/new-card", authenticate, upload("profile-file", true).array("file"), createNewCardController);

router.get("/profile", authenticate, getAllProfileController);
router.get("/profile-compopox", authenticate, getCompopoxController);
router.get("/status-profile", authenticate, getApprovedController);
router.get("/rejected-profile", authenticate, getRejectController);

router.put("/profile-status/:id",editStatusController);

router.get("/detail-profile/:id", authenticate, getDetailsProfileController); 
router.get("/profile/:id", getOneProfileController);

export default router;
