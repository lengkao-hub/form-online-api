import Router from "express";

import { uploadFiles } from "../../utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";
import {
  checkProfileExistenceController,
  createProfileController,
  editProfileController,
  getAllProfileController,
  getOneProfileController,
  getProfileBarcodeController,
} from "./controller";

const router = Router();

router.get("/profile/:id", getOneProfileController);
router.post( "/profile",authenticate, uploadFiles("profile", true, ["image", "oldImage"]), valResult, createProfileController );
router.put("/profile/:id", authenticate, uploadFiles("profile", true, ["image", "oldImage"]), valResult, editProfileController);
router.get("/profile", getAllProfileController);
router.get("/profile-barcode", authenticate, getProfileBarcodeController);
router.post("/profile-check-existence", checkProfileExistenceController);

export default router;
