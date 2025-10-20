import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(verifyJWT,upload.none(), createTweet )
router.route("/:tweetId").patch(verifyJWT,upload.none(), updateTweet )
router.route("/:tweetId").delete(verifyJWT,upload.none(), deleteTweet )
router.route("/user/:userId").get(verifyJWT,upload.none(), getUserTweets )

export default router;