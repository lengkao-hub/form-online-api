import Router from "express";

import authRouter from "./api/auth/router";
import dashboardRouter from "./api/dashboard/router";
import folderRouter from "./api/folder/router";
import profileRouter from "./api/profile/router";
import userRouter from "./api/user/router";

import {
  createLoginSwaggerController,
  swaggerLoginController,
} from "./swaggers/controller";

const router = Router();

router.use(profileRouter);
router.use(userRouter);
router.use(authRouter);
router.use(folderRouter);
router.use(dashboardRouter);

router.get("/swagger-login", createLoginSwaggerController);
router.post("/swagger-login", swaggerLoginController);

export default router;
