
import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    fileUrl:{
          type:String,
          default:null
    },
    fileType:{
            type:String,
          default:null
    },
    fileName:{
            type:String,
          default:null
    }
  },
  { timestamps: true }
);

export default mongoose.model("GroupMessage", groupMessageSchema);