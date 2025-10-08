// require("dotenv").config();
import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';
import ConnectDb from './db/index.js';
import dotenv from 'dotenv';

dotenv.config({
    path : './env'
})



ConnectDb();












// import express from "express";

// const app = express();

// ;(async () => {
//     try {
// await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
// app.on("errror", (error) => {
//             console.log("ERRR: ", error);
//             throw error
//         })
//           app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("error aaya ha ",error);
//         throw error;
//     }
// })()