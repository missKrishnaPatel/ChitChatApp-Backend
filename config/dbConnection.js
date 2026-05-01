// const mongoose = require("mongoose")
import mongoose from "mongoose";


export const dbConnect = () =>{
     mongoose.connect(process.env.DATABASE_URL)
     .then(()=>{
        console.log("DB connected successfully")
     }).catch((error)=>{
        console.log(error);
        console.log("DB connection failed");
     })
}