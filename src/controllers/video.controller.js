import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js";
import { deleteOnCloudinary, Uploadincloudnary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/likes.model.js";
import { Comment } from "../models/comment.model.js";

    //TOdo: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];

    // 1. $search for fuzzy match if query exists
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }

    // 2. Match stage to filter by published, owner, and exact title/description
    const matchFilter = { isPublished: true };

    if (query) {
        matchFilter.$or = [
            { title: query }, 
            { description: query }
        ];
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        matchFilter.owner = new mongoose.Types.ObjectId(userId);
    }

    pipeline.push({ $match: matchFilter });

    // 3. Sorting
    if (sortBy && sortType) {
        pipeline.push({
            $sort: { [sortBy]: sortType === "asc" ? 1 : -1 }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // 4. Lookup owner details
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerdetails",
                pipeline: [{ $project: { username: 1, "avatar.url": 1 } }]
            }
        },
        { $unwind: "$ownerdetails" }
    );

    // 5. Aggregate paginate
    const videoAggregate = Video.aggregate(pipeline);
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((item) => !item?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await Uploadincloudnary(videoFileLocalPath);
  const thumbnailFile = await Uploadincloudnary(thumbnailLocalPath);

  if (!videoFile?.url) {
    throw new ApiError(400, "Error uploading video file");
  }

  if (!thumbnailFile?.url) {
    throw new ApiError(400, "Error uploading thumbnail file");
  }

  const videoDetails = await Video.create({
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnailFile.url,
      public_id: thumbnailFile.public_id,
    },
    title,
    description,
    duration: videoFile.duration || 0,
    owner: req.user?._id,
    isPublished: false,
  });

  // ✅ Return response
  return res.status(200).json(
    new ApiResponse(200, videoDetails, "Video uploaded successfully")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
      throw new ApiError(400," invalid videoId")
    }

      if(!isValidObjectId(req.user?._id)) {
      throw new ApiError(400," invalid userID")
    }

    const video = await Video.aggregate([
      {
        $match : {
          _id : new mongoose.Types.ObjectId(videoId)
        }
      },
      {
        $lookup : {
          from : "likes",
          localField : "_id",
          foreignField : "video",
          as: "likes"
        }
      },
      {
        $lookup : {
          from : "comments",
          localField : "_id",
          foreignField : "video",
          as: "comments"
        }
      },
      {
      $lookup : {
          from : "users",
          localField : "owner",
          foreignField : "_id",
          as: "owner",
          pipeline : [
            {
        $lookup : {
          from : "subscriptions",
          localField : "_id",
          foreignField : "channel",
          as: "subscribers",
        }
            },
            {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                              isSubscribed : {
                                $cond : {
                                  if : { $in : [req.user?._id, "$subscribers.subscriber"] },
                                  then  :true,
                                  else: false
                                }
                              }
                            
                        }
                    },
                    {
                      $project : {
                          username: 1,
                          "avatar.url": 1,
                          subscribersCount: 1,
                          isSubscribed: 1
                      }
                    }
          ]
        }
  },
  {
    $addFields : {
      likesCount : {
        $size : "$likes"
      },
      commentsCount : {
        $size : "$comments"
      },
    owner : {
      $first  : "$owner"
    },
    isLiked : {
      $cond : {
        if :{ $in : [req.user?._id , "$likes.likedBy"] },
        then : true,
        else : false
      }
    },
    iscomment : {
      $cond : {
        if :{ $in : [req.user?._id , "$comments.owner"] },
        then : true,
        else : false
      }
    }
    }
  },
  {
    $project : {
                "videoFile.url": 1,
                title : 1,
                description  : 1,
                views : 1,
                createdAt: 1,
                duration: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                commentsCount : 1,
                iscomment : 1
    }
  }
    ]);

  if (!video.length) {
  throw new ApiError(404, "Video not found");
}

const user = await User.findById(req.user._id);

// 2️⃣ Check if the video is already in their watchHistory
const alreadyWatched = user.watchHistory.some(id => id.toString() === videoId);

if (!alreadyWatched) {
  // 3️⃣ Increment video views
  await Video.findByIdAndUpdate(videoId, 
    { $inc: { views: 1 } },
  { new: true }
  );
}

//   await Video.findByIdAndUpdate(
//   videoId,
//   { $inc: { views: 1 } },
//   { new: true } // return updated document
// );

    await User.findByIdAndUpdate(
      req.user?._id,
      {
      // $addToSet ensures it’s added only once (no duplicates).
            $addToSet: {
                watchHistory: videoId
            }
          },
        { new: true } )

  return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
})
    //TODo: update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }

    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await Uploadincloudnary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video please try again");
    }

    if (updatedVideo) {
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if(video?.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(400, "You can't delete this video as you are not the owner")
    }

  const deletevideo = await Video.findByIdAndDelete(video?._id);

    if (!deletevideo) {
          throw new ApiError(400, "Failed to delete the video please try again");
      }

      await deleteOnCloudinary(video.thumbnail.public_id)
      await deleteOnCloudinary(video.videoFile.public_id, "video")

    await Like.deleteMany({
      video : videoId
      })

        await Comment.deleteMany({
      video : videoId
      })

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }
    
        const video = await Video.findById(videoId);
    
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
    
        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,
                "You can't toogle publish status as you are not the owner"
            );
        }

        const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId, {
          $set : {
            isPublished : !video?.isPublished
          }
        },
        {
          new:true
        }
        )

      if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}