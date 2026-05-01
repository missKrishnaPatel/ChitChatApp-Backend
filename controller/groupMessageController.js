

import GroupMessage from "../models/groupMessage.model.js";
import { successResponse, errorResponse } from "../common/statuscode.js";

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return errorResponse(res, 400, "Group ID is required");
    }

    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: 1 });

    return successResponse(res, 200, {
      messages,
    });
  } catch (error) {
    console.log("Get Group Messages Error:", error);

    return errorResponse(res, 500, "Failed to fetch group messages");
  }
};

//  import GroupMessage from "../models/groupMessage.model.js";
// import { successResponse, errorResponse } from "../common/statuscode.js";

// export const getGroupMessages = async (req, res) => {
//   try {
//     const { groupId } = req.params;

//     const messages = await GroupMessage.find({ groupId })
//       .populate("senderId", "firstName lastName")
//       .sort({ createdAt: 1 });

//     return successResponse(res, 200, { messages });
//   } catch (error) {
//     return errorResponse(res, 500, "Failed to fetch group messages");
//   }
// };