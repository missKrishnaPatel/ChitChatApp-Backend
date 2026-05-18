import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import {io} from "../socket/socket.js";
import { errorResponse,successResponse } from "../common/statuscode.js";




export const createNewMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.userId;

    // FILE IS OPTIONAL
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const fileType = req.file ? req.file.mimetype : null;
    const fileName = req.file ? req.file.originalname : null;

    // MUST HAVE EITHER MESSAGE OR FILE
    if (!receiverId || (!message && !fileUrl)) {
      return errorResponse(res, 400, "Message or file is required");
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || "",
      fileUrl,
      fileType,
      fileName,
    });
     console.log(newMessage);
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    io.to(receiverId.toString()).emit(
  "newMessage",
  newMessage
);

    return successResponse(res, 200, "Message sent successfully", { newMessage });
  } catch (error) {
    console.error("Send Message Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};


export const getAllMessages = async(req,res)=>{
    try{
         const currentUserId = req.user.userId;
         const chatUserId = req.params.chatUserId;

         if(!chatUserId){
            return errorResponse(res,400,"Something went wrong during fetching id's")
            
         }
         const allMessages = await Conversation.findOne({
            members:{$all:[currentUserId,chatUserId]}
         }).populate("messages").populate("members","-password").exec();

            return successResponse(res,200,"successfully fetched all messages",{allMessages})
    }catch(error){
        
            return errorResponse(res,500,"Server error")
    }
};




export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return errorResponse(res, 404, "Message not found");
    }

    if (message.senderId.toString() !== userId) {
      return errorResponse(
        res,
        403,
        "You are not the owner of this message"
      );
    }

    message.message = "This message was deleted";
    message.isDeleted = true;

    await message.save();

    // Emit socket event to notify the receiver
    io.to(message.receiverId.toString()).emit(
  "messageDeleted",
  message
);

    return successResponse(res, 200, "Message deleted", {
      deletedMessage: message,
    });
  } catch (error) {
    console.log("Delete Message Error:", error);
    return errorResponse(res, 500, "Failed to delete message");
  }
};


export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || typeof message !== "string") {
      return errorResponse(res, 400, "Updated message text is required");
    }

    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return errorResponse(res, 404, "Message not found");
    }

    if (existingMessage.senderId.toString() !== userId) {
      return errorResponse(
        res,
        403,
        "You are not the owner of this message"
      );
    }

    existingMessage.message = message;
    existingMessage.isEdited = true;

    await existingMessage.save();

    // Emit socket event to notify the receiver
    io.to(existingMessage.receiverId.toString()).emit(
  "messageUpdated",
  existingMessage
);

    return successResponse(res, 200, "Message updated", {
      updatedMessage: existingMessage,
    });
  } catch (error) {
    console.log("Update Message Error:", error);
    return errorResponse(res, 500, "Failed to update message");
  }
};