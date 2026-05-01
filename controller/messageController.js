import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import {io,userSocketMap} from "../socket/socket.js";
import { errorResponse,successResponse } from "../common/statuscode.js";


export const createNewMessage = async(req,res)=>{
    try{
        const {receiverId, message} = req.body;
        const senderId = req.user.userId;

        if(!receiverId || !message || !senderId){
            return errorResponse(res,400, "Something went wrong during fetching data")
        }

        //find conversation
        let conversation = await Conversation.findOne({
            members: {$all:[senderId,receiverId]}
        });

        //create conversation
        if(!conversation){
            conversation = await Conversation.create({
                members:[senderId,receiverId]
            })
        }

        const newMessage = new Message({
            senderId:senderId,
            receiverId:receiverId,
            message:message
        })

        if(newMessage){
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([conversation.save(), newMessage.save()])
        const receiverSocketId = userSocketMap[receiverId];

        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage);
        }
        return successResponse(res,200,"Message send successfully",{newMessage})

    }catch(error){
        return errorResponse(res,500, "Internal server error")
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
