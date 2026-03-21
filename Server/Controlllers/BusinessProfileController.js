import { getAuth } from "@clerk/express";
import BusinessProfile from "../Models/BusinessProfileModles.js";
import mongoose from "mongoose";
import path from "path";

const API_BASE = 'http://localhost:5000'

// for helper function for uploading files to public

export const uploadedFilesToUrls = (req) => {
    const urls = {};
    if (!req?.files) return urls;
    const mapping = {
        logoName: "logoDataUrl",
        stampName: "stampDataUrl",
        signatureNameMeta: "signatureDataUrl",
        logo: "logoDataUrl",
        stamp: "stampDataUrl",
        signature: "signatureDataUrl",
    };
    Object.keys(mapping).forEach((field) => {
        const arr = req.files[field];
        if (Array.isArray(arr) && arr[0]) {
            const filename =
                arr[0].filename || (arr[0].path && path.basename(arr[0].path));
            if (filename) urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
        }
    });
    return urls;
}

// -----------------CREATE------------------------------

export const createBusinessProfile = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const body = req.body || {};
        const fileUrls = uploadedFilesToUrls(req);

        // Build document
        const doc = new BusinessProfile({
            _id: new mongoose.Types.ObjectId(),
            owner: userId, // associate invoice with Clerk userId
            businessName: body.businessName || "ABC Solutions",
            email: body.email || "",
            phone: body.phone || "",
            address: body.address || "",
            gst: body.gst || "",
            logoUrl: fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
            stampUrl: fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
            signatureUrl: fileUrls.signatureDataUrl || body.signatureDataUrl || body.signature || null,
            signatureOwnerName: body.signatureOwnerName || "",
            signatureOwnerTitle: body.signatureOwnerTitle || "",
            defaultTaxPercent: body.defaultTaxPercent || 18,
        });

        const saved = await doc.save();

        res.status(201).json({
            success: true,
            message: "Businessprofile created successfully",
            data: saved,
        });
    } catch (error) {
        console.error("Error creating Businessprofile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ----------------UPDATE BUSINESSPROFILE-------------

export const updateBusinessProfile = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Businessprofile ID" });
        }
        const body = req.body || {};
        const fileUrls = uploadedFilesToUrls(req);

        const existingProfile = await BusinessProfile.findById(id);
        if (!existingProfile) {
            return res
                .status(404)
                .json({ success: false, message: "Businessprofile not found" });
        }

        if (existingProfile.owner.toString() !== userId) {
            return res
                .status(403)
                .json({ success: false, message: "Unauthorized" });
        }

        // Build document
        const doc = new BusinessProfile({
            _id: id,
            owner: userId, // associate invoice with Clerk userId
            businessName: body.businessName || "ABC Solutions",
            email: body.email || "",
            phone: body.phone || "",
            address: body.address || "",
            gst: body.gst || "",
            logoUrl: fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
            stampUrl: fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
            signatureUrl: fileUrls.signatureDataUrl || body.signatureDataUrl || body.signature || null,
            signatureOwnerName: body.signatureOwnerName || "",
            signatureOwnerTitle: body.signatureOwnerTitle || "",
            defaultTaxPercent: body.defaultTaxPercent || 18,


        });
        const updated = await BusinessProfile.findByIdAndUpdate(id, doc, { new: true, runValidators: true });

        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Businessprofile not found" });
        }
        saved = await doc.save();

        res.status(201).json({
            success: true,
            message: "Businessprofile updated successfully",
            data: saved,
        });
    } catch (error) {
        console.error("Error updating Businessprofile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


// --------GET BUSINESSPROFILE--------

export const getBusinessProfile = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const profile = await BusinessProfile.findOne({ owner: userId });
        if (!profile) {
            return res
                .status(200)
                .json({ success: true, message: "Businessprofile not found", data: null });
        }

        res.status(200).json({
            success: true,
            message: "Businessprofile fetched successfully",
            data: profile,
        });
    } catch (error) {
        console.error("Error fetching Businessprofile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}