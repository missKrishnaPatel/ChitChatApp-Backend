import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";
// import groupModel from "../models/group.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// SOCKET AUTH MIDDLEWARE
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// STORE CONNECTED USERS
export const userSocketMap = {};

// SOCKET CONNECTION
io.on("connection", async (socket) => {
  try {
    const userId = socket.user.userId;

    userSocketMap[userId] = socket.id;

    console.log("Socket User Connected:", userId);

    // ===============================
    // AUTO JOIN ALL GROUPS OF USER
    // ===============================
    const userGroups = await Group.find({
      members: userId,
    });

    userGroups.forEach((group) => {
      socket.join(group._id.toString());
      console.log(`User ${userId} joined group ${group.groupName}`);
    });

    // ===============================
    // MANUAL JOIN GROUP
    // ===============================
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(`User ${userId} manually joined group ${groupId}`);
    });

    // ===============================
    // SEND GROUP MESSAGE
    // ===============================
    socket.on("sendGroupMessage", async ({ groupId, message }) => {
      try {
        if (!groupId || !message) return;

        // SAVE MESSAGE
        const newMessage = await GroupMessage.create({
          groupId,
          senderId: userId,
          message,
        });

        // POPULATE SENDER DETAILS
        const populatedMessage = await GroupMessage.findById(newMessage._id)
          .populate("senderId", "firstName lastName");

        // EMIT TO ALL GROUP MEMBERS
        io.to(groupId).emit("receiveGroupMessage", {
          ...populatedMessage.toObject(),
          senderName: `${populatedMessage.senderId.firstName} ${populatedMessage.senderId.lastName}`,
        });

        console.log(`Group message sent to group ${groupId}`);
      } catch (error) {
        console.log("Group Message Error:", error);
      }
    });

    // ===============================
    // DISCONNECT
    // ===============================
    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      console.log("Socket User Disconnected:", socket.id);
    });
  } catch (error) {
    console.log("Socket Connection Error:", error);
  }
});

export { app, server, io };