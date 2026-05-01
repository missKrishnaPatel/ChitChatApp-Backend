import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { dbConnect } from "./config/dbConnection.js";
import authRoute from "./routes/authRoute.js";
import messageRoute from "./routes/messageRoute.js";
import { app, server } from "./socket/socket.js";
import groupRoute from "./routes/groupRoutes.js";

dotenv.config();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/v1", authRoute);
app.use("/api/v1", messageRoute);
app.use("/api/v1", groupRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server running",
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await dbConnect();
});