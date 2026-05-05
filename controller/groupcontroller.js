import { errorResponse, successResponse } from "../common/statuscode.js";
import Group from "../models/group.model.js";
import { io, userSocketMap } from "../socket/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const creatorId = req.user.userId;

    const group = await Group.create({
      groupName,
      members: [...members, creatorId],
      admins: [creatorId],
    });
    console.log("ADMINS FIELD:", group.members);

    return successResponse(res, 201, { group });
  } catch (error) {
    return errorResponse(res, 500, "Group creation failed");
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await Group.find({
      members: userId,
    }).populate("members", "-password");

    return successResponse(res, 200, { groups });
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch groups");
  }
};


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
      return errorResponse(res, 400, "User already in group");
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");
    console.log("Updated Group:", updatedGroup);

    
    const userSocketId = userSocketMap[userId];
    if (userSocketId) {
      io.to(userSocketId).emit("joinNewGroup", groupId);
    }

   
    io.to(groupId).emit("groupUpdated", updatedGroup);

    return successResponse(res, 200, "Member added", {
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Add Member Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};


export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    console.log("body from request:", req.body);

    console.log("Group ID from request:", groupId);
    console.log("userId from request:", userId);
    console.log("requesterId from request:", requesterId);

    const group = await Group.findById(groupId);
    console.log("Group found:", group);
    if (!group) return errorResponse(res, 404, "Group not found");

    // Only admin allowed
    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can remove members");
    }

   
    if (!group.members.map(String).includes(userId)) {
      return errorResponse(res, 400, "User not in group");
    }

    
    group.members = group.members.filter((m) => String(m) !== String(userId));

   
    group.admins = group.admins.filter((a) => String(a) !== String(userId));

    // Ensure at least one admin
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0]);
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    
    io.to(groupId).emit("groupUpdated", updatedGroup);

   
    const userSocketId = userSocketMap[userId];
    if (userSocketId) {
      io.to(userSocketId).emit("memberRemoved", { groupId });
    }
    console.log("Updated Group after removal:", updatedGroup);
    return successResponse(res, 200, "Member removed", {
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};


export const makeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, 404, "Group not found");

    // Only admin allowed
    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can assign admin");
    }

    // Must be member
    if (!group.members.map(String).includes(userId)) {
      return errorResponse(res, 400, "User must be group member");
    }

    // Already admin
    if (group.admins.map(String).includes(userId)) {
      return errorResponse(res, 400, "User already admin");
    }

    group.admins.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

   
    io.to(groupId).emit("groupUpdated", updatedGroup);
    console.log("Updated Group after making admin:", updatedGroup);
    return successResponse(res, 200, "Admin added", {
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Make Admin Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, 404, "Group not found");

    // Only admin allowed
    if (!group.admins.map(String).includes(requesterId)) {
      return errorResponse(res, 403, "Only admins can remove admin");
    }

    // Must be admin
    if (!group.admins.map(String).includes(userId)) {
      return errorResponse(res, 400, "User is not admin");
    }

    // At least one admin required
    if (group.admins.length === 1) {
      return errorResponse(res, 400, "Group must have at least one admin");
    }

    group.admins = group.admins.filter((a) => String(a) !== String(userId));

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    
    io.to(groupId).emit("groupUpdated", updatedGroup);

    return successResponse(res, 200, "Admin removed", {
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Remove Admin Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId)
      .populate("members", "firstName lastName profilePicture")
      .populate("admins", "firstName lastName");

    if (!group) {
      return errorResponse(res, 404, "Group not found");
    }

    if (
      !group.members.some((member) => String(member._id) === String(userId))
    ) {
      return errorResponse(res, 403, "Access denied");
    }

    return successResponse(res, 200, {
      group,
    });
  } catch (error) {
    console.error("Get Group By ID Error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};
