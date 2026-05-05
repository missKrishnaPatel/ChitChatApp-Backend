// 


import { Router } from "express";
import authRoute from "./v1/authRoute.js";
import messageRoute from "./v1/messageRoute.js";
import groupRoute from "./v1/groupRoutes.js";
import groupMessageRoute from "./v1/groupMessageRoute.js";

const router = Router();

router.use("/v1", authRoute);
router.use("/v1", messageRoute);
router.use("/v1", groupRoute);
router.use("/v1", groupMessageRoute);

export default router;