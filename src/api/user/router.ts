import { Router } from "express";
import { userSchemaCreate } from "./validate";

import {
  createUserController,
  getManyUserController,
  getOneUserController,
  updateUserEditAccountController,
} from "./controller";

import { authenticate } from "../../utils/jwt";
import { valResult } from "../../utils/validateResult";

const router = Router();

router.post("/user", userSchemaCreate, valResult, createUserController);
router.get("/user", authenticate, getManyUserController);
router.get("/user/:id", authenticate, getOneUserController);
router.put("/user/:id", authenticate, valResult, updateUserEditAccountController);
// router.get("/user-aggregation", authenticate, getAggregationUserController);
router.post("/register", userSchemaCreate, valResult, createUserController);

export default router;