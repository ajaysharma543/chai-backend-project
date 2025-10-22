import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "50mb"}))
app.use(express.urlencoded({extended: true, limit: "50mb"}))
app.use(express.static("public"))
app.use(cookieParser())

import router from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import commentRouter from "./routes/comment.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likesRouter from "./routes/likes.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";


app.use("/api/v1/users", router);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/like", likesRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/dashboard", dashboardRouter);
export {app};
// cors


// origin: process.env.CORS_ORIGIN → allows requests only from a specific frontend URL (set in your .env, e.g. http://localhost:5173).
// credentials: true → allows sending cookies or authorization headers across origins (important for login systems).

// This middleware lets Express parse incoming JSON data (like from POST requests).
// limit: "16kb" means you’re limiting the JSON body size to 16 kilobytes to prevent large payload attacks.

// 🟩 app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// Parses form data (e.g., from HTML forms with application/x-www-form-urlencoded).
// extended: true → allows nested objects in form data.
// limit: "16kb" → restricts the data size, same reason as above.

// 🟩 app.use(express.static("public"))
// Serves static files (images, CSS, JS, etc.) from the public folder.
// Example: a request to /logo.png will serve public/logo.png.

// 🟩 app.use(cookieParser())
// Enables your app to read cookies from client requests (like session IDs or JWT tokens).
// Cookies are often used for user authentication or preferences.