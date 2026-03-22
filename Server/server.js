import 'dotenv/config';
import express from "express";
import cors from "cors";
import ConnectDB from "./Config/ConnectDB.js";
import { clerkMiddleware } from '@clerk/express';
import path from 'path';
import InvoiceRouter from "./Router/InvoiceRoures.js";
import BusinessProfileRoute from "./Router/BusinessProfileRoutes.js";
import AIInvoiceRoute from "./Router/AIinvoiceRoutes.js";
import PaymentRoute from "./Router/PaymentRoutes.js";

const PORT = process.env.PORT || 5000;


const app = express();




//Middeleware
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175", "http://localhost:5176", "http://127.0.0.1:5176"],
    credentials: true
}));
app.use(clerkMiddleware())
app.use(express.json({ limit: '20mb' }));
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

// Catch all handler: send back React's index.html file for any non-API routes
app.use((req, res) => {
    res.sendFile(path.join(process.cwd(), "../Client/dist/index.html"));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});