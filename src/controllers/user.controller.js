import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asynchandler.js'
import { Uploadincloudnary } from '../utils/cloudinary.js';

const registerUser = asyncHandler( async (req, res) => {

    console.log("req.files.avatar:", req.files?.avatar);
console.log("req.files.coverImage:", req.files?.coverImage);

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
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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

export {registerUser}