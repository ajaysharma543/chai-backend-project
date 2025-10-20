import mongoose, { isValidObjectId } from "mongoose"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweets.model.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;

    if(!content) {
        throw new ApiError(400, "content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user?._id
    })

    if (!tweet) {
            throw new ApiError(500, "failed to create tweet please try again");
        }
    
        return res
            .status(200)
            .json(new ApiResponse(200, tweet, "Tweet created successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const {tweetId} = req.params;

    if (!content?.trim()) {
throw new ApiError(400, "Content is required");
}

if (!isValidObjectId(tweetId)) {
throw new ApiError(400, "Invalid tweet ID");
}

const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit thier tweet");
    }

    const updatedtweet = await Tweet.findByIdAndUpdate(
        tweetId, {
            $set : {
                content
            } 
        },
        {
            new :true
        }
    )
    if (!updatedtweet) {
        throw new ApiError(500, "Failed to edit tweet please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedtweet, "Tweet updated successfully"));

})

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweetId");
        }

        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"));
    

})
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const currentUserId = req.user?._id; // needed for "isLiked"

  const gettweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerdetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likedetails",
        pipeline: [
          {
            $project: {
              likedBy: 1, // ✅ use the exact field name in your Like model
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likecount: { $size: "$likedetails" },
        ownerdetails: { $first: "$ownerdetails" },
        isLiked: {
          $cond: {
            if: {
              $in: [new mongoose.Types.ObjectId(currentUserId), "$likedetails.likedBy"], // ✅ fixed reference
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        content: 1,
        ownerdetails: 1,
        likecount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, gettweets, "Tweets fetched successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}