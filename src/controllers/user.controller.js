import jwt from "jsonwebtoken"
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asynchandler.js'
import { Uploadincloudnary } from '../utils/cloudinary.js';
import {v2 as cloudinary} from "cloudinary"
import { deleteFromCloudinary } from "../utils/deletefromcloudinart.js";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens  = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})

        return {accessToken ,refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    console.log("req.files", req.files);


    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    
    const {fullName, email, username, password } = req.body;
    console.log("email: ", fullName, email, username, password);

    if(  [fullName, email, username, password].some((field) => field?.trim() === "") ) {
        throw new ApiError(400, "fullname is required")
    }

    const Existeduser = await  User.findOne({
        $or : [{username}, {email}]
    })

    if(Existeduser) {
        throw new ApiError(409 , "user with same email and password already exists")
    }
    
const avatarLocalPath = req.files?.avatar?.[0]?.path;
// const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
}


    const avatar = await Uploadincloudnary(avatarLocalPath);
    const coverImage = await Uploadincloudnary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user =  await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        // thats the syntax which i want to remove
    )

        if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

        return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler (async (req,res) => {
      // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {username, email, password} = req.body;
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    // now the front end can access the options of cookies but cannot modify the cookies its very secure
    //  only server can modify this 

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler (async (req, res) => {
await User.findByIdAndUpdate(
    req.user._id, {
        $set : {
    refreshToken : undefined
        }
    },
    {
    new: true
    }
)
const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        
        if(!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }
        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
    
            const user = await User.findById(decodedToken._id);
    
            if(!user) {
            throw new ApiError(401, "invalid refresh token")
    }
    
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used")
            }
    
            const options = {
                secure : true,
                httpOnly : true
            }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res.status(200)
        .cookie("acesstoken", accessToken, options)
        .cookie("refreshtoken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken, refreshToken : newRefreshToken} , "access token refreshed"
            )
        )
        }  catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
        
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findOne(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
        const {fullName, email, }  = req.body;
        if(!(fullName ||email)) {
            throw  new ApiError(400 , "all fields are required")
        }

        const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")
        if(!user) {
            throw new ApiError(400, "user not found");
        }

        return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
if (user.coverImage) {
    await deleteFromCloudinary(user.coverImage);
}    const avatar = await Uploadincloudnary(avatarLocalPath);
    if (!avatar?.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }
    user.avatar = avatar.url;
    await user.save();
    console.log("Updated user:", user);
    return res.status(200).json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    );
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;

        if (!coverLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
}

const user = await User.findById(req.user?._id);
if (!user) throw new ApiError(404, "User not found");

if (user.coverImage) await deleteFromCloudinary(user.coverImage);

const coverImage = await Uploadincloudnary(coverLocalPath);
if (!coverImage?.url) throw new ApiError(400, "Error while uploading cover image");

user.coverImage = coverImage.url;
await user.save();

return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async(req, res) => {
    //  from prams like /login /signup youtube
const {username} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const Channel = await User.aggregate([
        {
            $match : {
                username: username?.toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        {
            $addFields: {
                // $size counts array elements
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        // in can find anyting in array and object and used to find or sort like things
                        // $in is a query operator used to check if a value exists in an array or matches any value in a list.
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

        if (!Channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, Channel[0], "User channel fetched successfully")
    )


})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    }