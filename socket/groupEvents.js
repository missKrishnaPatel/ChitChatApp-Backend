import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";

export const registerGroupEvents = (io, socket) => {
  const userId = socket.user.userId;

  // ===============================
  // AUTO JOIN USER GROUPS
  // ===============================
  Group.find({ members: userId })
    .then((groups) => {
      groups.forEach((group) => {
        socket.join(group._id.toString());
        console.log(
          `User ${userId} joined group ${group.groupName}`
        );
      });
    })
    .catch((error) => {
      console.log("Auto Join Group Error:", error);
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

      const newMessage = await GroupMessage.create({
        groupId,
        senderId: userId,
        message,
      });

      const populatedMessage = await GroupMessage.findById(
        newMessage._id
      ).populate("senderId", "firstName lastName");

      io.to(groupId).emit("receiveGroupMessage", {
        ...populatedMessage.toObject(),
        senderName: `${populatedMessage.senderId.firstName} ${populatedMessage.senderId.lastName}`,
      });

      console.log(`Group message sent to group ${groupId}`);
    } catch (error) {
      console.log("Send Group Message Error:", error);
    }
  });

  // ===============================
  // UPDATE GROUP MESSAGE
  // ===============================
  socket.on("updateGroupMessage", async ({ messageId, newMessage }) => {
    try {
      const message = await GroupMessage.findById(messageId);

      if (!message) {
        return socket.emit("messageError", {
          message: "Group message not found",
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

      io.to(message.groupId.toString()).emit(
        "groupMessageUpdated",
        message
      );

      console.log("Group message updated");
    } catch (error) {
      console.log("Update Group Message Error:", error);
    }
  });

  // ===============================
  // DELETE GROUP MESSAGE
  // ===============================
  socket.on("deleteGroupMessage", async ({ messageId }) => {
    try {
      const message = await GroupMessage.findById(messageId);

      if (!message) {
        return socket.emit("messageError", {
          message: "Group message not found",
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

      io.to(message.groupId.toString()).emit(
        "groupMessageDeleted",
        message
      );

      console.log("Group message deleted");
    } catch (error) {
      console.log("Delete Group Message Error:", error);
    }
  });
};