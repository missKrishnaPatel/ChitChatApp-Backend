import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

import { registerMessageEvents } from "./messageEvents.js";
import { registerGroupEvents } from "./groupEvents.js";

const app = express();
const server = http.createServer(app);

export const userSocketMap = {};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

export { io };



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

// ===============================
// SOCKET CONNECTION
// ===============================
io.on("connection", async (socket) => {
  try {
    const userId = socket.user.userId;

    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }
    userSocketMap[userId].push(socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    console.log("Socket User Connected:", userId);
    io.emit("userStatusChanged", {
      userId,
      isOnline: true,
      lastSeen: null,
    });

    // Register private chat events
    registerMessageEvents(io, socket, userSocketMap);

    // Register group chat events
    registerGroupEvents(io, socket);

    socket.on("disconnect", async () => {
      const userSockets = userSocketMap[userId] || [];
      const socketIndex = userSockets.indexOf(socket.id);
      if (socketIndex !== -1) {
        userSockets.splice(socketIndex, 1);
      }

      if (userSockets.length === 0) {
        delete userSocketMap[userId];

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { isOnline: false, lastSeen: new Date() },
          { new: true },
        );

        console.log("Socket User Disconnected:", socket.id);
        io.emit("userStatusChanged", {
          userId,
          isOnline: false,
          lastSeen: updatedUser?.lastSeen || new Date(),
        });
      }
    });
  } catch (error) {
    console.log("Socket Connection Error:", error);
  }
});

export { app, server };