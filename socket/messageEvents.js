import Message from "../models/message.model.js";

export const registerMessageEvents = (io, socket, userSocketMap) => {
  const userId = socket.user.userId;

  // ===============================
  // UPDATE PRIVATE MESSAGE
  // ===============================
  socket.on("updateMessage", async ({ messageId, newMessage }) => {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit("messageError", {
          message: "Message not found",
        });
      }

      if (message.senderId.toString() !== userId) {
        return socket.emit("messageError", {
          message: "Unauthorized",
        });
      }

      message.message = newMessage;
      message.isEdited = true;

      await message.save();

      socket.emit("messageUpdated", message);

      const receiverSocketId =
        userSocketMap[message.receiverId?.toString()];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageUpdated", message);
      }

      console.log("Private message updated");
    } catch (error) {
      console.log("Update Private Message Error:", error);
    }
  });

  // ===============================
  // DELETE PRIVATE MESSAGE
  // ===============================
  socket.on("deleteMessage", async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit("messageError", {
          message: "Message not found",
        });
      }

      if (message.senderId.toString() !== userId) {
        return socket.emit("messageError", {
          message: "Unauthorized",
        });
      }

      message.message = "This message was deleted";
      message.isDeleted = true;

      await message.save();

      socket.emit("messageDeleted", message);

      const receiverSocketId =
        userSocketMap[message.receiverId?.toString()];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", message);
      }

      console.log("Private message deleted");
    } catch (error) {
      console.log("Delete Private Message Error:", error);
    }
  });
};