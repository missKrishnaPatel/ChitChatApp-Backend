import { Router } from "express";
import { createGroup, getUserGroups } from "../controller/groupcontroller.js";

import { checkAuth } from "../middleware/auth.js";

const router = Router();
router.post("/group", checkAuth, createGroup);
router.get("/groups", checkAuth, getUserGroups);

export default router;
