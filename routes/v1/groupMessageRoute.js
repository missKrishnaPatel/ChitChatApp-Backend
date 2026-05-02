import { getGroupMessages, updateMessage, deleteMessage } from "../../controller/groupMessageController.js";
import { checkAuth } from "../../middleware/auth.js";
import { Router } from "express";
const router = Router();

router.get("/group-messages/:groupId", checkAuth, getGroupMessages);
router.put("/group/message/:messageId", checkAuth, updateMessage);
router.delete("/group/message/:messageId", checkAuth, deleteMessage);



export default router;