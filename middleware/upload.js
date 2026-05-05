import multer from "multer";
import path from "path";
import fs from "fs";


const uploadDir = "uploads";
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}


const storage = multer.diskStorage({
    destination: (req, file,cb)=>{
        cb(null, "uploads/");
    },

    filename: (req, file,cb)=>{
         cb(null, Date.now() + path.extname(file.originalname));
    }
})


export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});