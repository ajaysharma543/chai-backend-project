import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if(!userId) {
        throw new ApiError(404, "user not found")
    }

    const totalSubscribers = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group : {
                _id : null,
                subscribercount : {
                    $sum : 1
                }
            }
        }
    ])

    const video = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project : {
                totallikes : {
                    $size : "$likes"
                },
                totalviews : "$views",
                toalvideo : 1
            }
        },
        {
            $group :{
                _id : null,
                totallikes: {
                    $sum: "$totallikes"
                },
                totalViews: {
                    $sum: "$totalviews"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ])
    const channelStats = {
        totalSubscribers : totalSubscribers[0]?.subscribercount || 0,
        totallikes : video[0]?.totallikes || 0,
        totalVideos : video[0]?.totalVideos || 0,
        totalViews : video[0]?.totalViews || 0,
    }

    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channelStats,
                    "channel stats fetched successfully"
                )
            );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const videos = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",      // FIXED
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },
        {
            $sort: { createdAt: -1 }  // Sort by original date
        },
        {
            $project: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                isPublished: 1,
                likesCount: 1,
                createdAt: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});

export {
    getChannelStats, 
    getChannelVideos
    }