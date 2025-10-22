import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle-video/:videoId").post(verifyJWT, toggleVideoLike )
router.route("/videos").get(verifyJWT, getLikedVideos )
router.route("/toggle-comment/:commentId").post(verifyJWT, toggleCommentLike )
router.route("/toggle-tweet/:tweetId").post(verifyJWT, toggleTweetLike )

export default router;