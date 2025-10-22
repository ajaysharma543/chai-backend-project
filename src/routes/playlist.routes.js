import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
addVideoToPlaylist,
createPlaylist,
deletePlaylist,
getPlaylistById,
getUserPlaylists,
removeVideoFromPlaylist,
updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

router.post("/create", verifyJWT, upload.none(), createPlaylist);

router.patch("/:playlistId/addvideo/:videoId", verifyJWT, upload.none(), addVideoToPlaylist);
router.patch("/:playlistId/removevideo/:videoId", verifyJWT, upload.none(), removeVideoFromPlaylist);
router.get("/users/:userId", verifyJWT, getUserPlaylists);

router
.route("/:playlistId")
.get(verifyJWT, getPlaylistById)
.patch(verifyJWT, updatePlaylist)
.delete(verifyJWT, deletePlaylist);

export default router;