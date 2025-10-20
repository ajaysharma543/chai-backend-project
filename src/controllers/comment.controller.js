import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Like } from "../models/likes.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const video =await Video.findById(videoId);

    if (!video) {
            throw new ApiError(404, "Video not found");
        }
    
        const commentsAggregate = Comment.aggregate([
            {
                $match : {
                    video : new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner"
                }
            },
            {
                $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
            },
            {
                $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
            },
            {
                $addFields : {
                    likescount : {
                        $size : "$likes",
                    },
                    owner : {
                        $first : "$owner"
                    },                   
                        isLiked  : {
                            $cond : {
                                if : {
                                    $in : [req.user?._id, "$likes.likedBy"]
                                },
                                then : true ,
                                else : false
                            }
                        }
                }
            },
            {
            $sort: {
                createdAt: -1
            }
        },
            {
            $project: {
                content: 1,
                createdAt: 1,
                likescount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
        ]);

        const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    )
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
const { videoId } = req.params;
const { content } = req.body;

// 1. Validate inputs
if (!content?.trim()) {
throw new ApiError(400, "Content is required");
}

if (!isValidObjectId(videoId)) {
throw new ApiError(400, "Invalid video ID");
}

// 2. Check video existence
const video = await Video.findById(videoId);
if (!video) {
throw new ApiError(404, "Video not found");
}

// 3. Create comment
const comment = await Comment.create({
content: content.trim(),
video: videoId,
owner: req.user?._id,
});

// 4. Return success
return res
.status(201)
.json(new ApiResponse(201, comment, "Comment created successfully"));
});


const updateComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params;
    const {content} = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only comment owner can edit their comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,{
            $set : {
                content,
            }
        },
        {
            new : true
        }
    )
    if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment please try again");
    }
    return res
            .status(200)
            .json(
                new ApiResponse(200, updatedComment, "Comment edited successfully")
            );
})

const deleteComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "only comment owner can delete their comment");
    }

    const deletedcomment = await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
            comment: commentId,
            likedBy: req.user._id
        });
    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }