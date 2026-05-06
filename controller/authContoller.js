import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../common/statuscode.js";
import { io } from "../socket/socket.js";

export const signUp = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  try {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return errorResponse(res, 400, "Please fill all the input fields");
    }

    if (password !== confirmPassword) {
      return errorResponse(
        res,
        400,
        "Password and confirmPassword not matched",
      );
    }

    const isUserExist = await User.findOne({ email: email });

    if (isUserExist) {
      return errorResponse(res, 400, "Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicture = `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}%20${lastName}`;

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profilePicture,
    });
    return successResponse(res, 200, "SignUp successfully", { newUser });
  } catch (error) {
    return errorResponse(res, 500, "Internal server errror");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const isUserRegistered = await User.findOne({ email }).select("+password");

    if (!isUserRegistered) {
      return errorResponse(res, 404, "Email not registered");
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      isUserRegistered.password,
    );

    if (isPasswordMatched) {
      const payload = {
        // firstName:firstName,
        // lastName:lastName,
        email: email,
        userId: isUserRegistered._id,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const userDetails = await User.findById(isUserRegistered._id).select(
        "-password",
      );

      return successResponse(res, 200, "Login successful", {
        token,
        userDetails,
      });
    } else {
      return errorResponse(res, 400, "password wrong");
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Internal server errror");
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return errorResponse(
        res,
        400,
        "Something went wrong during fetching userId",
      );
    }

    const getAllUser = await User.find({ _id: { $ne: userId } });
    console.log(getAllUser);
    return successResponse(res, 200, "Successfully fetched all users", {
      getAllUser,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Internal server errror");
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, "User fetched", { user });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Internal server errror");
  }
};



export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return errorResponse(res, 400, "No file uploaded");
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: imageUrl },
      { new: true }
    );

    io.emit("userProfileUpdated", {
      userId: String(updatedUser._id),
      profilePicture: updatedUser.profilePicture,
      user: updatedUser,
    });

    return successResponse(res, 200, "Profile picture updated", {
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Internal server error");
  }
};