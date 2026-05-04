import { errorResponse, successResponse } from "../common/statuscode.js";
import Group from "../models/group.model.js";
import { io , userSocketMap} from "../socket/socket.js";

export const createGroup = async(req,res) =>{
    try{
         const {groupName, members} = req.body;
         const creatorId = req.user.userId;

         const group = await Group.create({
            groupName,
            members:[...members, creatorId],
            admin:[creatorId],
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




// ADD MEMBER
export const addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, 404, "Group not found");

    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can add members");
    }

    if (group.members.map(String).includes(userId)) {
      return errorResponse(res, 400, "User is already a member");
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    // EMIT TO ALL CURRENT GROUP MEMBERS
    io.to(groupId).emit("groupUpdated", updatedGroup);

    // TELL NEW MEMBER TO JOIN SOCKET ROOM
    const newMemberSockets = userSocketMap[userId] || [];
    newMemberSockets.forEach((socketId) => {
      io.to(socketId).emit("joinNewGroup", groupId);
    });

    return successResponse(res, 200, "Member added", { group: updatedGroup });
  } catch (error) {
    console.error("Add Member Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};

// REMOVE MEMBER
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, 404, "Group not found");

    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can remove members");
    }

    if (String(userId) === requesterId && group.admins.length === 1) {
      return errorResponse(res, 400, "Cannot remove yourself as the only admin");
    }

    group.members = group.members.filter((m) => String(m) !== String(userId));
    group.admins = group.admins.filter((a) => String(a) !== String(userId));

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    // EMIT UPDATED GROUP TO REMAINING MEMBERS
    io.to(groupId).emit("groupUpdated", updatedGroup);

    // NOTIFY REMOVED USER
    const removedUserSockets = userSocketMap[userId] || [];
    removedUserSockets.forEach((socketId) => {
      io.to(socketId).emit("memberRemoved", { groupId, removedUserId: userId });
    });

    return successResponse(res, 200, "Member removed", { group: updatedGroup });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};

// MAKE ADMIN
export const makeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, 404, "Group not found");

    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can promote members");
    }

    if (group.admins.map(String).includes(String(userId))) {
      return errorResponse(res, 400, "User is already an admin");
    }

    group.admins.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    // EMIT TO ALL GROUP MEMBERS
    io.to(groupId).emit("groupUpdated", updatedGroup);

    return successResponse(res, 200, "User promoted to admin", { group: updatedGroup });
  } catch (error) {
    console.error("Make Admin Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};

// REMOVE ADMIN
export const removeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, 404, "Group not found");

    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can demote admins");
    }

    if (group.admins.length === 1) {
      return errorResponse(res, 400, "Group must have at least one admin");
    }

    group.admins = group.admins.filter((a) => String(a) !== String(userId));
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    // EMIT TO ALL GROUP MEMBERS
    io.to(groupId).emit("groupUpdated", updatedGroup);

    return successResponse(res, 200, "Admin removed", { group: updatedGroup });
  } catch (error) {
    console.error("Remove Admin Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};