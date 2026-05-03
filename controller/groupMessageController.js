

import GroupMessage from "../models/groupMessage.model.js";
import { successResponse, errorResponse } from "../common/statuscode.js";
import { io } from "../socket/socket.js";

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log(`Fetching messages for group: ${groupId}`);

    if (!groupId) {
      return errorResponse(res, 400, "Group ID is required");
    }

    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: 1 });

      console.log(`Fetched ${messages} messages for group ${groupId}`);

    return successResponse(res, 200, {
      messages,
    });
  } catch (error) {
    console.log("Get Group Messages Error:", error);

    return errorResponse(res, 500, "Failed to fetch group messages");
  }
};


export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await GroupMessage.findById(messageId);

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

    // Emit socket event to notify all users in the group
    io.to(message.groupId.toString()).emit("groupMessageDeleted", message);

    return successResponse(res, 200, "Message deleted", {
      deletedMessage: message,
    });
  } catch (error) {
    console.log("Delete Message Error:", error);
    return errorResponse(res, 500, "Failed to delete message");
  }
};


export const updateMessage = async (req,res)=>{
  try {
     const {messageId} = req.params;
     const {message:newMessage} = req.body;
     const userId = req.user.userId;
      if (!newMessage || typeof newMessage !== "string") {
      return errorResponse(res, 400, "Updated message text is required");
    }

     const existingMessage = await GroupMessage.findById(messageId);
     
     if(!existingMessage){
      return errorResponse(res,404,"Message not found");
     }

      if(existingMessage.senderId.toString() !== userId){
        return errorResponse(res,403,"You are not the owner of this message");
      }

      existingMessage.message = newMessage;
      existingMessage.isEdited = true;
      await existingMessage.save();

      // Emit socket event to notify all users in the group
      io.to(existingMessage.groupId.toString()).emit("groupMessageUpdated", existingMessage);

      return successResponse(res, 200, { updatedMessage:existingMessage,});
  }catch (error) {
    console.log("Update Message Error:", error);
    return errorResponse(res, 500, "Failed to update message");
  }
}