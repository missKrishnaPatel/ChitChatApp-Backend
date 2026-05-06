import { Router } from "express";
import { signUp ,login, getAllUsers, getMe, uploadProfilePicture} from "../../controller/authContoller.js";
import { checkAuth } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
// import {  } from "../../middleware/auth.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login",login);
router.get("/alluser", checkAuth, getAllUsers);
router.get("/me", checkAuth, getMe);
router.post("/upload-profile-picture", checkAuth,upload.single("file"), uploadProfilePicture);

export default router;
