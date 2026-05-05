import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { dbConnect } from "./config/dbConnection.js";
import { app, server } from "./socket/socket.js";
import router from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api", router);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Server running",
//   });
// });

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await dbConnect();
});
