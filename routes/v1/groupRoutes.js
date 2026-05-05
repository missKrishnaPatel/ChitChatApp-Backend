import { Router } from "express";
import { createGroup, getUserGroups, addMember,removeAdmin,removeMember,makeAdmin } from "../../controller/groupcontroller.js";

import { checkAuth } from "../../middleware/auth.js";

const router = Router();
router.post("/group", checkAuth, createGroup);
router.get("/groups", checkAuth, getUserGroups);
router.post("/group/member", checkAuth, addMember);
router.put("/group/member", checkAuth, removeMember);
router.put("/group/admin", checkAuth, makeAdmin);
router.delete("/group/admin", checkAuth, removeAdmin);

export default router;
