import mongoose, {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlists.model.js"
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    if(!(name|| description)) {
        throw new ApiError(400, "name and description both are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner : req.user?._id
    }) 
    if (!playlist) {
        throw new ApiError(500, "failed to create playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"));

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { playlistId } = req.params;

    if (!name || !description) {
        throw new ApiError(400, "name and description both are required");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set: {
                name,
                description,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "playlist updated successfully"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
    
        if (playlist.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only owner can delete the playlist");
        }

        await Playlist.findByIdAndDelete(playlist?._id)

        return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {},
                        "playlist removed successfully"
                    )
                );

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "video not found")
    }
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "video not found")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        throw new ApiError(404, "video not found");
    }
if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "only owner can add video to thier playlist");
}

const addedvideoplaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
        $addToSet : {
            videos : videoId
        }
    },
    {new : true}
)

    if (!addedvideoplaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }
return res.status(200).json(new ApiResponse(200,addedvideoplaylist, "video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "video not found")
    }

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlist not found")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        throw new ApiError(404, "video not found");
    }
if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "only owner can remove to thier playlist");
}

const removevideoplaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
        $pull : {
            videos : videoId
        }
    },
    {new : true}
)

    if (!removevideoplaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }
return res.status(200).json(new ApiResponse(200,removevideoplaylist, "video removed successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid PlaylistId");
        }

        const playlist = await Playlist.findById(playlistId);

        if(!playlist) {
            throw new ApiError(404, "playlist not found")
        }

        const playlistVideos = await Playlist.aggregate([
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "videos",
                    foreignField : "_id",
                    as: "videos"
                }
            },
            {
                $match : {
                    "videos.isPublished" : true,
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as: "owner"
                }
            },
            {
                $addFields : {
                    owner : {
                        $first : "$owner"
                    },
                    totalVideos : {
                        $size : "$videos"
                    },
                    totalViews : {
                        $sum : "$videos.views"
                    }
                }
            },
            {
                $project :{
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
                }
            }
        ])
    return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos, "playlist fetched successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                },
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));

})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}