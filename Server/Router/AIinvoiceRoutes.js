import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getAuth } from "@clerk/express";
import BusinessProfile from "../Models/BusinessProfileModles.js";
import Invoice from "../Models/InvoiceModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const AIinvoiceRoute = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("Gemini API key is not defined. Set GEMINI_API_KEY in the root .env or environment variables.");
}

let ai = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

//-----------MODELS TO TRY-------
const MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0",
];

//IN THE PROMPT YOU CAN PROVIDE THESE DETAILS AND IT WILL FILL THOSE AUTOMATIVE
function buildInvoicePrompt(promptText) {
    const invoiceTemplate = {
        invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        fromBusinessName: "",
        fromEmail: "",
        fromAddress: "",
        fromPhone: "",
        client: { name: "", email: "", address: "", phone: "" },
        items: [{ id: "1", description: "", qty: 1, unitPrice: 0 }],
        taxPercent: 18,
        notes: ""
    };

    return `
You are an invoice generation assistant.

Task:
  - Analyze the user's input text and produce a valid JSON object only (no explanatory text).
  - The JSON MUST match the schema below (include all fields even if empty).
  - Ensure all dates are ISO 'YYYY-MM-DD' strings and numeric fields are numbers.

Schema:
${JSON.stringify(invoiceTemplate, null, 2)}

User input:
${promptText}

Output: valid JSON only (no surrounding code fences, no commentary).
`;
}

async function tryGenerateWithModel(modelName, prompt) {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
    });

    let text =
        (response && typeof response.text === "string" && response.text) ||
        (response &&
            response.output &&
            Array.isArray(response.output) &&
            response.output[0] &&
            response.output[0].content &&
            Array.isArray(response.output[0].content) &&
            response.output[0].content[0] &&
            response.output[0].content[0].text) ||
        // alternate: response?.outputs?.[0]?.text
        (response &&
            response.outputs &&
            Array.isArray(response.outputs) &&
            response.outputs[0] &&
            (response.outputs[0].text || response.outputs[0].content)) ||
        // fallback: JSON-stringify the whole response (so we at least have something)
        null;

    if (!text && response && Array.isArray(response.outputs)) {
        const joined = response.outputs
            .map((o) => {
                if (!o) return "";
                if (typeof o === "string") return o;
                if (typeof o.text === "string") return o.text;
                if (Array.isArray(o.content)) {
                    return o.content.map((c) => (c && c.text) || "").join("\n");
                }
                return JSON.stringify(o);
            })
            .filter(Boolean)
            .join("\n\n");
        if (joined) text = joined;
    }

    if (!text && response) {
        try {
            text = JSON.stringify(response);
        } catch {
            text = String(response);
        }
    }

    if (!text || !String(text).trim()) {
        throw new Error("Empty text returned from model");
    }
    return { text: String(text).trim(), modelName };
}


AIinvoiceRoute.post('/generate', async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const profile = await BusinessProfile.findOne({ owner: userId });
        const plan = profile?.subscriptionPlan || 'Starter';
        const endDate = profile?.subscriptionEndDate;

        if (plan === 'Starter' || !endDate) {
            const invoiceCount = await Invoice.countDocuments({ owner: userId });
            if (invoiceCount >= 5) {
                return res.status(403).json({ success: false, message: "Free plan limit reached. Please upgrade to a monthly or yearly plan to generate more invoices." });
            }
        } else {
            // Paid plan logic: strictly enforce the end date
            const now = new Date();
            const expirationDate = new Date(endDate);
            if (now.getTime() > expirationDate.getTime()) {
                return res.status(403).json({ success: false, message: "Subscription expired. Please renew your plan to generate more invoices." });
            }
        }

        if (!API_KEY) {
            return res.status(500).json({ success: false, message: "ServerConfiguration failed no key found" })
        }

        const { prompt } = req.body;
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Prompt is required" })
        }

        const invoicePrompt = buildInvoicePrompt(prompt);


        let lastErr = null;
        let lastText = null;
        let usedModel = null;

        for (const m of MODEL_CANDIDATES) {
            try {
                const { text, modelName } = await tryGenerateWithModel(m, invoicePrompt);
                if (text && text.trim()) {
                    lastText = text;
                    usedModel = modelName;
                    break;
                }
            } catch (err) {
                console.warn(`Model ${m} failed:`, err?.message || err);
                lastErr = err;
                continue;
            }
        }

        if (!lastText) {
            const errMsg =
                (lastErr && lastErr.message) ||
                "All candidate models failed. Check API key, network, or model availability.";
            console.error("AI generation failed (no text):", errMsg);
            return res.status(502).json({
                success: false,
                message: "AI generation failed",
                detail: errMsg
            });
        }

        const text = lastText.trim();
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
            console.error("AI response did not contain JSON object:", {
                usedModel,
                text
            });
            return res.status(502).json({
                success: false,
                message: "AI returned malformed response (no JSON found)",
                raw: text,
                model: usedModel
            });
        }

        const jsonString = text.slice(firstBrace, lastBrace + 1);
        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON from AI response:", parseError, {
                usedModel,
                jsonString,
                raw: text,
            });
            return res.status(502).json({
                success: false,
                message: "AI returned invalid JSON",
                raw: jsonString,
                model: usedModel
            });
        }

        // Normalize items array (ensure it's an array)
        if (!Array.isArray(parsed.items)) {
            parsed.items = [];
        }

        // Ensure all items have required fields
        parsed.items = parsed.items.map((item) => ({
            id: item.id || Date.now() + Math.random(),
            description: item.description || "",
            qty: typeof item.qty === "number" ? item.qty : 1,
            unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : 0,
        }));

        // Ensure taxPercent is a number
        if (typeof parsed.taxPercent !== "number") {
            parsed.taxPercent = 18;
        }

        // Calculate totals
        const subtotal = parsed.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
        const taxAmount = subtotal * (parsed.taxPercent / 100);
        const total = subtotal + taxAmount;

        // Add calculated fields
        parsed.subtotal = subtotal;
        parsed.taxAmount = taxAmount;
        parsed.total = total;

        // Add metadata
        parsed.metadata = {
            modelUsed: usedModel,
            timestamp: new Date().toISOString(),
            promptLength: prompt.length,
        };

        res.status(200).json({
            success: true,
            data: parsed,
            model: usedModel,
            raw: text,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to generate invoice" });
    }
})

export default AIinvoiceRoute;
