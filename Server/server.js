import './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import cors from "cors";
import ConnectDB from "./Config/ConnectDB.js";
import { clerkMiddleware } from '@clerk/express';
import InvoiceRouter from "./Router/InvoiceRoures.js";
import BusinessProfileRoute from "./Router/BusinessProfileRoutes.js";
import AIInvoiceRoute from "./Router/AIinvoiceRoutes.js";
import PaymentRoute from "./Router/PaymentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
 




const app = express();




//Middeleware
const allowedOrigins = [
    "https://ai-billing-software-2.onrender.com",
    "https://ai-billing-software-3.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176"
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(clerkMiddleware())
app.use(express.json({ 
    limit: '20mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ limit: '20mb', extended: true }))

//DB
ConnectDB();

//Routes
app.use('/uploads', express.static(path.join(process.cwd(), "uploads")))

app.use('/api/invoice', InvoiceRouter)
app.use('/api/businessprofile', BusinessProfileRoute)
app.use('/api/ai-invoice', AIInvoiceRoute)
app.use('/api/payment', PaymentRoute)

// Serve static files from the React app build directory
app.use(express.static(path.join(process.cwd(), "../Client/dist")));

// Catch all handler: only for non-API routes (send back React's index.html for SPA)
app.use((req, res) => {
    // Don't serve HTML for API requests that reached here (they should have been handled above)
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    res.sendFile(path.join(process.cwd(), "../Client/dist/index.html"));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});