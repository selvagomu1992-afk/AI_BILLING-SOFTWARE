import Invoice from "../Models/InvoiceModels.js";
import mongoose from "mongoose";
import { getAuth } from "@clerk/express";
import path from 'path';
import BusinessProfile from "../Models/BusinessProfileModles.js";

const API_BASE = 'https://ai-billing-software-4.onrender.com'

// computeTota [ subtotal, tax, total]
const computeTotals = (items = [], taxPercent = 0) => {
    const safe = Array.isArray(items) ? items.filter(Boolean) : []
    const subtotal = safe.reduce((sum, item) => sum + (Number(item.unitPrice) || 0), 0);
    const tax = (subtotal * Number(taxPercent || 0)) / 100
    const total = subtotal + tax
    return { subtotal, tax, total }
}

// Parse formData items
const parseItemsField = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            return JSON.parse(val)
        } catch (error) {
            console.error('Failed to parse itemsFeild', error)
            return []
        }
    }
    return val
}

// Check if string objectId
const isObjectIdString = (value) => {
    return typeof value === 'string' && value.length === 24 && /^[0-9a-fA-F]+$/.test(value)
}


// for helper function for uploading files to public

export const uploadedFilesToUrls = (req) => {
    const urls = {};
    if (!req.files) return urls;
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

// generate unique invoice number to avoid collision in the DB for invoice number
export const generateUniqueInvoiceNumber = async (attempts = 10) => {
    for (let i = 0; i < attempts; i++) {
        const ts = Date.now().toString();
        const suffix = Math.floor(Math.random() * 900000).toString().padStart(6, "0");
        const candidate = `INV-${ts.slice(-6)}-${suffix}`;

        const exists = await Invoice.exists({ invoiceNumber: candidate });
        if (!exists) return candidate;
        await new Promise((r) => setTimeout(r, 2));
    }
    return new mongoose.Types.ObjectId().toString();
}

// ---------------CREAT------------------------------

export const createInvoice = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const profile = await BusinessProfile.findOne({ owner: userId });
        const plan = profile?.subscriptionPlan || 'Starter';
        const endDate = profile?.subscriptionEndDate;

        if (plan === 'Starter' || !endDate) {
            const invoiceCount = await Invoice.countDocuments({ owner: userId });
            if (invoiceCount >= 5) {
                return res.status(403).json({ success: false, message: "Free plan limit reached. Please upgrade to a monthly or yearly plan to create more invoices." });
            }
        } else {
            // Paid plan logic: strictly enforce the end date
            const now = new Date();
            const expirationDate = new Date(endDate);
            if (now.getTime() > expirationDate.getTime()) {
                return res.status(403).json({ success: false, message: "Subscription expired. Please renew your plan to create more invoices." });
            }
        }

        const body = req.body || {};
        const items = Array.isArray(body.items)
            ? body.items
            : parseItemsField(body.items);
        const taxPercent = Number(
            body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? 0
        );
        const totals = computeTotals(items, taxPercent);
        const fileUrls = uploadedFilesToUrls(req);

        // If client supplied invoiceNumber, ensure it doesn't already exist
        let invoiceNumberProvided =
            typeof body.invoiceNumber === "string" && body.invoiceNumber.trim()
                ? String(body.invoiceNumber).trim()
                : null;

        if (invoiceNumberProvided) {
            const duplicate = await Invoice.exists({ invoiceNumber: invoiceNumberProvided });
            if (duplicate) {
                return res
                    .status(409)
                    .json({ success: false, message: "Invoice number already exists" });
            }
        }

        // generate a unique invoice number (or use provided)
        let invoiceNumber = invoiceNumberProvided || (await generateUniqueInvoiceNumber());

        // Build document
        const doc = new Invoice({
            _id: new mongoose.Types.ObjectId(),
            owner: userId, // associate invoice with Clerk userId
            invoiceNumber,
            invoiceDate: body.issueDate || new Date().toISOString().slice(0, 10),
            dueDate: body.dueDate || "",
            fromBusinessName: body.fromBusinessName || "",
            fromEmail: body.fromEmail || "",
            fromAddress: body.fromAddress || "",
            fromPhone: body.fromPhone || "",
            fromGst: body.fromGst || "",
            client:
                typeof body.client === "string" && body.client.trim()
                    ? { name: body.client }
                    : body.client || {},
            items,
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            currency: body.currency || "INR",
            status: body.status ? String(body.status).toLowerCase() : "draft",
            taxPercent,
            logoDataUrl:
                fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
            stampDataUrl:
                fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
            signatureDataUrl:
                fileUrls.signatureDataUrl ||
                body.signatureDataUrl ||
                body.signature ||
                null,
            signatureName: body.signatureName || "",
            signatureTitle: body.signatureTitle || "",
            notes: body.notes || body.aiSource || "",
        });

        // Save with retry on duplicate-key (race conditions)
        let saved = null;
        let attempts = 0;
        const maxSaveAttempts = 6;
        while (attempts < maxSaveAttempts) {
            try {
                saved = await doc.save();
                break; // success
            } catch (err) {
                // If duplicate invoiceNumber (race), regenerate and retry
                if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
                    attempts += 1;
                    // generate a new invoiceNumber and set on doc
                    const newNumber = await generateUniqueInvoiceNumber();
                    doc.invoiceNumber = newNumber;
                    // loop to try save again
                    continue;
                }
                // other errors → rethrow
                throw err;
            }
        }

        if (!saved) {
            return res.status(500).json({
                success: false,
                message: "Failed to create invoice after multiple attempts",
            });
        }

        return res
            .status(201)
            .json({ success: true, message: "Invoice created", data: saved });
    } catch (err) {
        console.error("createInvoice error:", err);
        if (err.type === "entity.too.large") {
            return res
                .status(413)
                .json({ success: false, message: "Payload too large" });
        }
        // handle duplicate key at top-level just in case
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
            return res
                .status(409)
                .json({ success: false, message: "Invoice number already exists" });
        }
        return res.status(500).json({ success: false, message: "Server error" });
    }

}

//--------------LIST OF ALL INVOICE----------------

export const getInvoice = async (req, res) => {
    try {
        const authObj = getAuth(req) || {};
        const { userId } = authObj;
        console.log("Invoice GET request received. Auth header:", req.headers.authorization ? "Present" : "Missing", "UserId:", userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication Required"
            });
        }
        const q = { owner: userId };
        if (req.query.status) q.status = req.query.status
        if (req.query.invoiceNumber) q.invoiceNumber = req.query.invoiceNumber;

        // for filter
        if (req.query.search) {
            const search = req.query.search.trim();
            const searchRegex = new RegExp(search, "i");
            q.$or = [
                { formEmail: { $regex: search, $options: "i" } },
                { client: { name: { $regex: search, $options: "i" } } },
                { client: { email: { $regex: search, $options: "i" } } },
                { client: { address: { $regex: search, $options: "i" } } },
                { client: { phone: { $regex: search, $options: "i" } } },
                { fromBusinessName: { $regex: search, $options: "i" } },
                { fromEmail: { $regex: search, $options: "i" } },
                { fromAddress: { $regex: search, $options: "i" } },
                { fromPhone: { $regex: search, $options: "i" } },
                { fromGst: { $regex: search, $options: "i" } },
            ];
        }
        const invoice = await Invoice.find(q).sort({ invoiceDate: -1 }).lean();
        return res.status(200).json({
            success: true,
            message: "Invoices fetched successfully",
            data: invoice
        })
    } catch (error) {
        console.error("GETINVOICE Error : ", error)
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })

    }
}

// -----GET INVOICE BY ID--------

export const getInvoiceById = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authendication Required"
            })
        }

        const { id } = req.params;
        let inv;
        if (isObjectIdString(id)) inv = await Invoice.findById(id);
        else inv = await Invoice.findOne({ invoiceNumber: id });
        if (!inv) return res.status(404).json({
            success: false,
            message: "Invoice Not Found"
        })

        if (inv.owner && String(inv.owner) !== String(userId)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden not your Invoice"
            })

        }
        return res.status(200).json({
            success: true,
            message: "Invoice fetched successfully",
            data: inv
        })
    } catch (error) {
        console.error("GETINVOICEBYID Error : ", error)
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}

// -----UPDATE INVOICE--------

export const updateInvoice = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authendication Required"
            })
        }

        const { id } = req.params;
        const body = req.body || {}

        const query = isObjectIdString(id) ? { _id: id, owner: userId } : { invoiceNumber: id, owner: userId }
        const existing = await Invoice.findOne(query)

        if (!existing) {
            return res.status(404).json({ success: false, message: "Invoice not found" })
        }

        // if user Change the invoice Number
        // ensure that it not existing already or not in use

        if (body.invoiceNumber && String(body.invoiceNumber).trim() !== existing.invoiceNumber) {
            const conflict = await Invoice.findOne({ invoiceNumber: String(body.invoiceNumber).trim() });
            if (conflict && String(conflict._id) !== String(existing._id)) {
                return res
                    .status(409)
                    .json({ success: false, message: "Invoice number already exists" });
            }
        }

        let items = [];
        if (Array.isArray(body.items)) items = body.items;
        else if (typeof body.items === "string" && body.items.length) {
            try {
                items = JSON.parse(body.items);
            } catch {
                items = [];
            }
        }

        const taxPercent = Number(
            body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? existing.taxPercent ?? 0
        );
        const totals = computeTotals(items, taxPercent);
        const fileUrls = uploadedFilesToUrls(req);

        // to update we can update these feilds
        const update = {
            invoiceNumber: body.invoiceNumber,
            invoiceDate: body.issueDate,
            dueDate: body.dueDate,
            fromBusinessName: body.fromBusinessName,
            fromEmail: body.fromEmail,
            fromAddress: body.fromAddress,
            fromPhone: body.fromPhone,
            fromGst: body.fromGst,
            client:
                typeof body.client === "string" && body.client.trim()
                    ? { name: body.client }
                    : body.client || existing.client || {},
            items,
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            currency: body.currency,
            status: body.status ? String(body.status).toLowerCase() : undefined,
            taxPercent,
            logoDataUrl:
                fileUrls.logoDataUrl ||
                (body.logoDataUrl || body.logo) ||
                undefined,
            stampDataUrl:
                fileUrls.stampDataUrl ||
                (body.stampDataUrl || body.stamp) ||
                undefined,
            signatureDataUrl:
                fileUrls.signatureDataUrl ||
                (body.signatureDataUrl || body.signature) ||
                undefined,
            signatureName: body.signatureName,
            signatureTitle: body.signatureTitle,
            notes: body.notes,
        };
        Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

        const updated = await Invoice.findByIdAndUpdate(
            { _id: existing._id },
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(500).json({
            success: false,
            message: "Failed to update invoice"
        })

        return res.status(200).json({
            success: true,
            message: "Invoice updated",
            data: updated
        })

    } catch (err) {
        console.error("updateInvoice error:", err);
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
            return res
                .status(409)
                .json({ success: false, message: "Invoice number already exists" });
        }
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

// -------------DELETE to Invoice---------------

export const deleteInvoice = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authendication Required"
            })
        }

        const { id } = req.params;
        const body = req.body || {}

        const query = isObjectIdString(id) ? { _id: id, owner: userId } : { invoiceNumber: id, owner: userId }

        const found = await Invoice.findOne(query);
        if (!found) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            })
        }

        await Invoice.deleteOne({ _id: found._id });
        return res.status(200).json({
            success: true,
            message: "Invoice deleted successfully"
        })

    } catch (err) {
        console.error("deleteInvoice error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

