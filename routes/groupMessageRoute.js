import { getGroupMessages } from "../controller/groupMessageController";
import { checkAuth } from "../middleware/auth";
import { Router } from "express";
const router = Router();

router.get("/group-messages/:groupId", checkAuth, getGroupMessages);



export default router;