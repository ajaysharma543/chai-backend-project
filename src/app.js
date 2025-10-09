import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

export {app};
// app.use(express.json({ limit: "16kb" }));

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