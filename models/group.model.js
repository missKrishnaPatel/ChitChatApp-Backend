import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    groupName:{
        type:String,
        required: true
    },
    groupImage:{
        type:String,
        default:"",
    },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }]
    ,
    admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
},{timestamps: true});

export default mongoose.model("Group", groupSchema);