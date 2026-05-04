import { Router } from "express";
// import { createNewMessage, getAllMessages,updateMessage,deleteMessage} from "../../controller/messageController.js";
import { checkAuth } from "../../middleware/auth.js";
import {upload} from "../../middleware/upload.js";
import { createNewMessage,getAllMessages,updateMessage,deleteMessage } from "../../controller/messageController.js";
const router = Router();

router.post("/send-message", checkAuth,upload.single("file"),createNewMessage);
// router.post("/send-file", checkAuth, upload.single("file"), createNewMessage);
router.get("/get-all-messages/:chatUserId", checkAuth, getAllMessages);
router.put("/message/:messageId", checkAuth, updateMessage);
router.delete("/message/:messageId", checkAuth, deleteMessage);


export default router;
