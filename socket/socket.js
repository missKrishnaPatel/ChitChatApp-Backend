import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
// import {redisClient} from "../redis/redisClient.js";
import redisClient from "../redis/redisClient.js";

import { registerMessageEvents } from "./messageEvents.js";
import { registerGroupEvents } from "./groupEvents.js";

const app = express();
const server = http.createServer(app);

// export const userSocketMap = {};

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false,
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

/*
// SOCKET CONNECTION
io.on("connection", async (socket) => {
  try {
    const userId = socket.user.userId;

    const count = await redisClient.hIncrBy("onlineUsers", userId);

    if(count === 1) {
      await redisClient.sAdd("onlineUserIds", userId);


      io.emit("userStatusChanged", {
        userId,
        isOnline:true,
        lastSeen: null,
      })
    }


   

   

    // if (!userSocketMap[userId]) {
    //   userSocketMap[userId] = [];
    // }
    // userSocketMap[userId].push(socket.id);

    // await User.findByIdAndUpdate(userId, { isOnline: true });

    console.log("Socket User Connected:", userId);
    // io.emit("userStatusChanged", {
    //   userId,
    //   isOnline: true,
    //   lastSeen: null,
    // });
    io.emit("userOnline", userId);

    // Register private chat events
    registerMessageEvents(io, socket);

    // Register group chat events
    registerGroupEvents(io, socket);

    socket.on("disconnect", async () => {
      console.log("Socket User Disconnected:", userId);
      // const userSockets = userSocketMap[userId] || [];
  //     const socketIndex = userSockets.indexOf(socket.id);
  //     if (socketIndex !== -1) {
  //       userSockets.splice(socketIndex, 1);
  //     }

  //     if (userSockets.length === 0) {
  //       delete userSocketMap[userId];

  //       const updatedUser = await User.findByIdAndUpdate(
  //         userId,
  //         { isOnline: false, lastSeen: new Date() },
  //         { new: true },
  //       );

  //       console.log("Socket User Disconnected:", socket.id);
  //       io.emit("userStatusChanged", {
  //         userId,
  //         isOnline: false,
  //         lastSeen: updatedUser?.lastSeen || new Date(),
  //       });
  //     }
  //   });
  // } catch (error) {
  //   console.log("Socket Connection Error:", error);
  // }

   const remaining = await redisClient.decr(`online:${userId}`);

      // all tabs/devices closed
      if (remaining <= 0) {

        await redisClient.del(`online:${userId}`);

        await redisClient.sRem("online_users", userId);

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            lastSeen: new Date(),
          },
          { new: true }
        );

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
    */


  io.on("connection", async (socket) => {
  try {
    console.log("New socket connection:", socket.id);
    const userId = socket.user.userId;

    // join personal room
    socket.join(userId.toString());

    // increment socket count
    const count = await redisClient.incr(`online:${userId}`);


    console.log(`User ${userId} connected with socket ${socket.id}. Socket count: ${count}`);

    // first active socket
    if (count === 1) {
  try {
    const test = await redisClient.sAdd("online_users", userId);
    console.log(`sAdd result: ${test}`);
    
    const members = await redisClient.sMembers("online_users");
    console.log(`online_users after sAdd:`, members);
  } catch (err) {
    console.log("REDIS sAdd ERROR:", err); // ← this will reveal the real error
  }

  io.emit("userStatusChanged", { userId, isOnline: true, lastSeen: null });
}

    console.log("Socket User Connected:", userId);

    registerMessageEvents(io, socket);

    registerGroupEvents(io, socket);

    socket.on("disconnect", async () => {

      console.log("Socket User Disconnected:", userId);

      const remaining = await redisClient.decr(`online:${userId}`);
      console.log(`User ${userId} disconnected from socket ${socket.id}. Remaining sockets: ${remaining}`);

      
        console.log(`User ${userId} is now offline. Cleaning up Redis entries.`);
        await redisClient.del(`online:${userId}`);

        await redisClient.sRem("online_users", userId);

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            lastSeen: new Date(),
          },
          { new: true }
        );

        io.emit("userStatusChanged", {
          userId,
          isOnline: false,
          lastSeen: updatedUser?.lastSeen || new Date(),
        });
      
    });

  } catch (error) {
    console.log("Socket Connection Error:", error);
  }
});

// });


export { app, server };