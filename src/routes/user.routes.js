import { Router } from "express";
import { loggedoutUser, loginUser, registerUser } from "../controllers/user.contoller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.contoller.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)
router.route("/login").post(loginUser)    

//secured routes
router.route("/logout").post(verifyJWT,loggedoutUser)
router.route("/refresh-token").post(refreshAccessToken)
export default router