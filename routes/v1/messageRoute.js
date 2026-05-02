import { Router } from "express";
import { createNewMessage, getAllMessages,updateMessage,deleteMessage} from "../../controller/messageController.js";
// import { updateMessage,deleteMessage } from "../../controller/groupMessageController.js";
import { checkAuth } from "../../middleware/auth.js";

const router = Router();

router.post("/send-message", checkAuth, createNewMessage);
router.get("/get-all-messages/:chatUserId", checkAuth, getAllMessages);
router.put("/message/:messageId", checkAuth, updateMessage);
router.delete("/message/:messageId", checkAuth, deleteMessage);


export default router;
