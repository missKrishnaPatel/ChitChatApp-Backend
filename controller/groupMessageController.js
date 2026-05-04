

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



export const sendGroupFile = async (req, res) => {
  try {
    const { groupId } = req.body;
    console.log(`Received request to send file to group ${groupId}`);
    const senderId = req.user.userId;
      console.log("req.file ", req.file);   
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const fileType = req.file ? req.file.mimetype : null;
    const fileName = req.file ? req.file.originalname : null;
    const { message } = req.body;

    if (!groupId || (!message && !fileUrl)) {
      return errorResponse(res, 400, "Message or file is required");
    }

    const newMessage = await GroupMessage.create({
      groupId,
      senderId,
      message: message || "",
      fileUrl,
      fileType,
      fileName,
    });

    const populatedMessage = await GroupMessage.findById(newMessage._id)
      .populate("senderId", "firstName lastName");

    const messageToEmit = {
      ...populatedMessage.toObject(),
      senderName: `${populatedMessage.senderId.firstName} ${populatedMessage.senderId.lastName}`,
    };

    // EMIT TO ALL GROUP MEMBERS
    io.to(groupId).emit("receiveGroupMessage", messageToEmit);

    return successResponse(res, 200, "File sent successfully", { newMessage: messageToEmit });
  } catch (error) {
    console.error("Send Group File Error:", error);
    return errorResponse(res, 500, "Internal server error");
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