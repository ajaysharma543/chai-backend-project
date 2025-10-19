import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route("/subscribe/:channelId").post(verifyJWT,toggleSubscription )
router.route("/channel/:channelId").get(verifyJWT,getUserChannelSubscribers )
router.route("/subscriber/:subscriberId").get(verifyJWT,getSubscribedChannels )


export default router;