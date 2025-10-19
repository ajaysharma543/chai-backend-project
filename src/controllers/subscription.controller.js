
import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    if (!req.user?._id) throw new ApiError(401, "Unauthorized");


    const subscribe = await Subscription.findOne ({
        subscriber : req.user ?._id,
        channel : channelId,
    })

if (subscribe) {
    await Subscription.findByIdAndDelete(subscribe._id);
    return res.status(200).json(new ApiResponse(200, { subscribe: false }, "unsubscribed successfully"));
}

// Else, create subscription
await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
});
return res.status(200).json(new ApiResponse(200, { subscribe: true }, "subscribed successfully"));
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    let { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channel");
    }

    channelId = new mongoose.Types.ObjectId(channelId);

    const getchannel = await Subscription.aggregate([
        { $match: { channel: channelId } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        }
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $in: [
                                    channelId,
                                    { $map: { input: "$subscribedToSubscriber", as: "s", in: "$$s.subscriber" } }
                                ]
                            },
                            subscribercount: { $size: { $ifNull: ["$subscribedToSubscriber", []] } }
                        }
                    }
                ]
            }
        },
        { $unwind: "$subscriber" },
        {
            $project: {
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribercount: 1
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, getchannel, "subscribers fetched successfully")
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    let { subscriberId } = req.params;
    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "invalid channel")
    }

    subscriberId = new mongoose.Types.ObjectId(subscriberId);

    const susbscribedChannels = await Subscription.aggregate([
        {
            $match : {
                subscriber : subscriberId,
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channel",
                pipeline : [
                    {
                        $lookup : {
                            from : "videos",
                            localField : "_id",
                            foreignField : "owner",
                            as : "videos",
                        }
                    },
                    {
                        $addFields : {
                            latestvideo : {
                                $last : "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$channel"
        },
        {
            $project : {
                channel : {
                    _id : 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestvideo : {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    }
                }
            }
        }
    ])

    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    susbscribedChannels,
                    "subscribed channels fetched successfully"
                )
            );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
