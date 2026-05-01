import { Router } from "express";
import { signUp ,login, getAllUsers} from "../controller/authContoller.js";
import { checkAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login",login);
router.get("/alluser", checkAuth, getAllUsers);

export default router;
