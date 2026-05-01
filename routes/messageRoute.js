import { Router } from "express";
import { createNewMessage, getAllMessages } from "../controller/messageController.js";
import { checkAuth } from "../middleware/auth.js";

const router = Router();

router.post("/send-message", checkAuth, createNewMessage);
router.get("/get-all-messages/:chatUserId", checkAuth, getAllMessages);


export default router;
