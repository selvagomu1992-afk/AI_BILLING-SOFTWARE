import mongoose from "mongoose";

const itemsSchema = new mongoose.Schema({
    id: { type: String, default: "" },
    description: { type: String, default: "" },
    hsn: { type: String, default: "" },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
});

const InvoiceSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true,
        index: true
    },
    // it is Clerk Id
    // its must be Unique for each Invoice
    invoiceNumber: {
        type: String,
        required: true,

    },
    invoiceDate: {
        type: Date,
        required: true,
        index: true
    },

    dueDate: {
        type: Date,
        default: ""
    },

    // Business info
    fromBusinessName: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromAddress: { type: String, default: "" },
    fromPhone: { type: String, default: "" },
    fromGst: { type: String, default: "" },

    // Client info
    client: {
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        address: { type: String, default: "" },
        phone: { type: String, default: "" },
    },

    items: { type: [itemsSchema], default: [] },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["draft", "unpaid", "paid", "overdue"], default: "draft" },

    //FOR ASSETS HANDLIGS
    logoDataUrl: { type: String, default: null },
    stampDataUrl: { type: String, default: null },
    signatureDataUrl: { type: String, default: null },

    signatureName: { type: String, default: "" },
    signatureTitle: { type: String, default: "" },

    taxPercent: { type: Number, default: 18 },

    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
}, {
    timestamps: true
})

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
