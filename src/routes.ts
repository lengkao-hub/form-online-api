import Router from "express";
 
import authRouter from "./api/auth/router";
import districtRouter from "./api/district/router";
import profileRouter from "./api/profile/router";
import provinceRouter from "./api/province/router";
import userRouter from "./api/user/router";
import villageRouter from "./api/village/router";

import {
  createLoginSwaggerController,
  swaggerLoginController,
} from "./swaggers/controller";

const router = Router();
 
router.use(districtRouter); 
router.use(profileRouter);
router.use(provinceRouter);
router.use(userRouter);
router.use(authRouter); 
router.use(villageRouter); 

router.get("/swagger-login", createLoginSwaggerController);
router.post("/swagger-login", swaggerLoginController);

export default router;
