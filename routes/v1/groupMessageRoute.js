import { getGroupMessages, updateMessage, deleteMessage,sendGroupFile } from "../../controller/groupMessageController.js";
import { checkAuth } from "../../middleware/auth.js";
import { Router } from "express";
import { upload } from "../../middleware/upload.js";
// import { sendGroupFile } from "../../controller/groupMessageController.js";
const router = Router();


router.post("/group/send-file", checkAuth, upload.single("file"), sendGroupFile);
router.get("/group-messages/:groupId", checkAuth, getGroupMessages);
router.put("/group/message/:messageId", checkAuth, updateMessage);
router.delete("/group/message/:messageId", checkAuth, deleteMessage);



export default router;