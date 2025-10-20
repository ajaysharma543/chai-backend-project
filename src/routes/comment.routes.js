import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/:videoId").post(verifyJWT, upload.none(), addComment);
router.route("/:videoId").get(verifyJWT, upload.none(), getVideoComments);
router.route("/:commentId").patch(verifyJWT, upload.none(), updateComment);
router.route("/:commentId").delete(verifyJWT, upload.none(), deleteComment);

export default router