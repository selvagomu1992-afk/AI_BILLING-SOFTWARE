import express from "express";
import multer from "multer";
import { clerkMiddleware } from "@clerk/express";
import path from "path";
import { createBusinessProfile, updateBusinessProfile, getBusinessProfile } from "../Controlllers/BusinessProfileController.js";

const BusinessProfileRoute = express.Router();

BusinessProfileRoute.use(clerkMiddleware());

//---Multer Storage---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), "uploads"));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `business_profile_${unique}${ext}`);
    },
});

const upload = multer({ storage });





//--------CREATE--------------

BusinessProfileRoute.post("/create", upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "stamp", maxCount: 1 },
    { name: "signature", maxCount: 1 },
]), createBusinessProfile);

//---------UPDATE-----------

BusinessProfileRoute.put("/update/:id", upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "stamp", maxCount: 1 },
    { name: "signature", maxCount: 1 },
]), updateBusinessProfile);


BusinessProfileRoute.get("/get", getBusinessProfile);
export default BusinessProfileRoute;
