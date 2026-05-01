import { errorResponse, successResponse } from "../common/statuscode.js";
import Group from "../models/group.model.js";

export const createGroup = async(req,res) =>{
    try{
         const {groupName, members} = req.body;
         const admin = req.user.userId;

         const group = await Group.create({
            groupName,
            members:[...members, admin],
            admin,
         });

         return successResponse(res,201,{group});
    }catch(error){
          return errorResponse(res,500,"Group creation failed");
    }
}


export const getUserGroups = async (req,res) =>{
    try{
        const userId = req.user.userId;

        const groups = await Group.find({
            members: userId,
        }).populate("members", "-password");

        return successResponse(res,200,{groups})

        }
    catch(error){
        return errorResponse(res,500,"Failed to fetch groups")
    }
}
