import mongoose from "mongoose";


const BusinessProfileSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true,
        index: true
    },
    businessName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        default: "",
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        default: "",
    },
    address: {
        type: String,
        required: false,
        default: "",
    },
    gst: {
        type: String,
        required: false,
        default: "",
    },


    // for Images
    logoUrl: {
        type: String,
        required: false,
        default: null,
    },
    stampUrl: {
        type: String,
        required: false,
        default: null,
    },
    signatureUrl: {
        type: String,
        required: false,
        default: null,
    },
    signatureOwnerName: {
        type: String,
        required: false,
        default: "",
    },
    signatureOwnerTitle: {
        type: String,
        required: false,
        default: "",
    },
    defaultTaxPercent: {
        type: Number,
        required: false,
        default: 18,
    },
    subscriptionPlan: {
        type: String,
        required: false,
        default: 'Starter', // Initial default
    },
    subscriptionPeriod: {
        type: String,
        required: false,
        default: 'monthly',
    },
    subscriptionStatus: {
        type: String,
        required: false,
        default: 'inactive', // 'active', 'inactive', 'cancelled'
    },
    subscriptionEndDate: {
        type: Date,
        required: false,
        default: null,
    },

}, {
    timestamps: true
})

const BusinessProfile = mongoose.models.BusinessProfile || mongoose.model("BusinessProfile", BusinessProfileSchema);

export default BusinessProfile;
