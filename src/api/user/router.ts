import { Router } from "express";
import { userSchemaCreate } from "./validate";

import {
  createUserCompanyController,
  createUserController,
  getManyUserController,
  getOneUserController,
  updateUserCompanyController,
  updateUserEditAccountController,
} from "./controller";

import { upload } from "src/utils/file-helper";
import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";

const router = Router();
router.post("/user",authenticate, userSchemaCreate, valResult, createUserCompanyController);
router.get("/user", authenticate, getManyUserController);
router.get("/user/:id", authenticate, getOneUserController);
router.put("/user/:id", authenticate, valResult,updateUserCompanyController );
// router.get("/user-aggregation", authenticate, getAggregationUserController);
router.post("/register", userSchemaCreate, valResult, createUserController);

router.get("/users/:id", getOneUserController);
router.post("/users", userSchemaCreate,upload("companyFile", true).array("companyFile"), createUserController);
router.put("/users/:id", valResult,upload("companyFile", true).array("companyFile"), updateUserEditAccountController );

export default router; 