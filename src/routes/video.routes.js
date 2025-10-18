import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { publishAVideo,
    getVideoById, 
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
} from "../controllers/video.controller.js";

const router = Router();

// 📤 Upload video route
router
.route("/uploadvideo")
.post(
verifyJWT,
upload.fields([
    { 
        name: "videoFile",
        maxCount: 1
    },
    {
            name: "thumbnail",
            maxCount: 1
            },
]),
publishAVideo
);

router.route("/v/:videoId")
.get(verifyJWT, getVideoById)
.delete(verifyJWT, deleteVideo )
.patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle-publish/:videoId").patch(verifyJWT, togglePublishStatus )
router.route("/all-videos").get(getAllVideos); 
export default router;