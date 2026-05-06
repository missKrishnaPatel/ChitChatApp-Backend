import { Router } from "express";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember,
  removeAdmin,
  removeMember,
  makeAdmin,
} from "../../controller/groupcontroller.js";

import { checkAuth } from "../../middleware/auth.js";
import { updateGroupImage } from "../../controller/groupcontroller.js";
import { upload } from "../../middleware/upload.js";

const router = Router();
router.post("/group", checkAuth, createGroup);
router.get("/groups", checkAuth, getUserGroups);
router.get("/group/:groupId", checkAuth, getGroupById);


router.post("/group/member", checkAuth, addMember);
router.put("/group/member", checkAuth, removeMember);
router.put("/group/admin", checkAuth, makeAdmin);
router.delete("/group/admin", checkAuth, removeAdmin);


router.post("/group/add-member", checkAuth, addMember);
router.post("/group/remove-member", checkAuth, removeMember);
router.post("/group/make-admin", checkAuth, makeAdmin);
router.post("/group/update-image", checkAuth, upload.single("file"), updateGroupImage);
export default router;
