import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },                                                                                                                                                                                                                                                                                                                                                                                                          
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    message:{
        type:String,
        default: "",
    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    isEdited:{
        type:Boolean,
        default:false,
    },
    fileUrl:{
        type:String,
        default:null,
    },
    fileType:{
        type:String,
        default:null,
    },
    fileName: { type: String, default: null }, 
    
},{timestamps:true});

const Message = mongoose.model("Message", messageSchema);

export default Message;
