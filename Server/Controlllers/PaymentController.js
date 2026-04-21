import axios from 'axios';
import crypto from 'crypto';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import BusinessProfile from '../Models/BusinessProfileModles.js';
import { getAuth } from '@clerk/express';

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com';
const CASHFREE_MODE = (process.env.CASHFREE_MODE || 'production').toLowerCase();

// Server URL configuration (used for return/notify URLs)
const SERVER_PORT = process.env.PORT || 5000;
const SERVER_PROTOCOL = process.env.SERVER_PROTOCOL || (CASHFREE_MODE === 'production' ? 'https' : 'http');
const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
let SERVER_BASE_URL = process.env.CASHFREE_SERVER_URL || `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`;

// Make sure webhook doesn't accidentally point to localhost in cloud
if ((SERVER_BASE_URL.includes('localhost') || SERVER_BASE_URL.includes('127.0.0.1')) && process.env.NODE_ENV === 'production') {
    SERVER_BASE_URL = 'https://ai-billing-software-7.onrender.com';
}

if (!process.env.CASHFREE_SERVER_URL && !process.env.SERVER_HOST && !process.env.NODE_ENV) {
     SERVER_BASE_URL = 'https://ai-billing-software-7.onrender.com'; // Safe ultimate fallback for their specific render instance if env vars are completely missing
}
const cashfreeAxios = axios.create();

cashfreeAxios.interceptors.request.use((config) => {
    const masked = (value) => (typeof value === 'string' ? `${value.slice(0, 4)}...${value.slice(-4)}` : value);
    console.log('Cashfree request:', {
        url: config.url,
        method: config.method,
        headers: Object.keys(config.headers || {}),
        mode: CASHFREE_MODE,
        appId: masked(CASHFREE_APP_ID),
        secret: masked(CASHFREE_SECRET_KEY),
    });
    return config;
});

const cashfree = new Cashfree(
    CASHFREE_MODE === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY,
    undefined,
    undefined,
    undefined,
    undefined,
    cashfreeAxios
);

export const createCheckoutSession = async (req, res) => {
    console.log('createCheckoutSession invoked');
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            console.error('Cashfree configuration missing', { CASHFREE_APP_ID: !!CASHFREE_APP_ID, CASHFREE_SECRET_KEY: !!CASHFREE_SECRET_KEY });
            return res.status(500).json({ success: false, message: 'Cashfree configuration missing (CASHFREE_APP_ID or CASHFREE_SECRET_KEY)' });
        }

        // Detect common placeholder values
        if (CASHFREE_APP_ID.includes('your_') || CASHFREE_APP_ID.includes('dummy')) {
            console.error('Cashfree app id appears to be a placeholder', { CASHFREE_APP_ID });
            return res.status(500).json({ success: false, message: 'Cashfree app id appears to be a placeholder. Please set a real app id.' });
        }

        const { plan, period } = req.body;

        // Determine price based on plan and period
        let amount = 0;
        if (plan === 'Professional') {
            amount = period === 'annual' ? 500 : 50;
        } else if (plan === 'Enterprise') {
            amount = period === 'annual' ? 5000 : 500;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        // Generate unique order ID
        const safeUserId = String(userId).replace(/[^A-Za-z0-9_]/g, '_');
        const orderId = `ORDER_${Date.now()}_${safeUserId}`.slice(0, 50);

        // Prepare order request for Cashfree
        const orderRequest = {
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_email: "user@example.com", // Replace with real email
                customer_phone: "9999999999", // Replace with real phone
            },
            order_meta: {
                return_url: process.env.CASHFREE_RETURN_URL || `${SERVER_BASE_URL}/api/payment/success?order_id=${orderId}`,
                notify_url: process.env.CASHFREE_NOTIFY_URL || `${SERVER_BASE_URL}/api/payment/webhook`,
            },
            order_tags: {
                plan: plan,
                period: period,
            }
        };

        // Create order using Cashfree SDK
        const response = await cashfree.PGCreateOrder(orderRequest);

        const paymentSessionId = response?.data?.payment_session_id;
        if (paymentSessionId) {
            return res.status(200).set('Content-Type', 'application/json').json({
                success: true,
                payment_session_id: paymentSessionId,
                order_id: orderId,
            });
        }

        // Check if response indicates an error
        const errorMessage = response?.data?.message || response?.data?.error || response?.data?.description || 'Order creation failed';
        console.error('Cashfree order creation failed', {
            status: response?.status,
            data: response?.data,
            headers: response?.headers,
        });
        return res.status(response?.status === 200 ? 400 : (response?.status || 400)).set('Content-Type', 'application/json').json({
            success: false,
            message: errorMessage,
            cashfree: {
                status: response?.status,
                data: response?.data,
            },
        });

    } catch (error) {
        const errorData = error?.response?.data;
        const logged = {
            message: error?.message,
            status: error?.response?.status,
            data: errorData,
        };
        console.error('Cashfree Create Order Error:', logged);

        const errorMessage =
            (errorData && typeof errorData === 'object' && (errorData.message || errorData.error || errorData.description)) ||
            (typeof errorData === 'string' ? errorData : null) ||
            error?.message ||
            'Internal Server Error';
        const responseBody = {
            success: false,
            message: errorMessage,
            cashfree: logged,
        };

        // If Cashfree returned a 200 with an error payload, normalize to 400.
        let statusCode = 400; // Always return 400 for errors

        return res.status(statusCode).set('Content-Type', 'application/json').json(responseBody);
    }
};

export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-cashfree-signature'];
        const payload = JSON.stringify(req.body);

        // Verify webhook signature
        const expectedSignature = crypto.createHmac('sha256', CASHFREE_SECRET_KEY).update(payload).digest('hex');

        if (signature !== expectedSignature) {
            console.error("Webhook signature verification failed");
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const eventData = req.body;

        if (eventData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
            const orderId = eventData.data.order.order_id;
            const orderTags = eventData.data.order.order_tags;

            const plan = orderTags.plan;
            const period = orderTags.period;
            const userId = eventData.data.customer_details.customer_id;

            try {
                let profile = await BusinessProfile.findOne({ owner: userId });

                if (!profile) {
                    profile = new BusinessProfile({ owner: userId, businessName: 'My Business' });
                }

                profile.subscriptionPlan = plan;
                profile.subscriptionPeriod = period;
                profile.subscriptionStatus = 'active';

                // Calculate expiration date
                const now = new Date();
                if (period === 'annual') {
                    now.setFullYear(now.getFullYear() + 1);
                } else {
                    now.setMonth(now.getMonth() + 1);
                }
                profile.subscriptionEndDate = now;

                await profile.save();

                console.log(`User ${userId} successfully subscribed to ${plan} via Cashfree`);
            } catch (err) {
                console.error("Failed to fulfill order:", err);
                return res.status(500).json({ success: false, message: 'Failed to update subscription' });
            }
        }

        res.status(200).json({ success: true, message: 'Webhook processed successfully' });

    } catch (error) {
        console.error("Cashfree Webhook Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const handlePaymentSuccess = async (req, res) => {
    // Redirect to frontend success page
    const orderId = req.query.order_id;
    const clientUrl = process.env.CLIENT_URL || 'https://ai-billing-software-3.onrender.com';
    res.redirect(`${clientUrl}/app/dashboard?payment=success&order_id=${orderId}`);
};

export const handlePaymentFailure = async (req, res) => {
    // Redirect to frontend with failure status
    const orderId = req.query.order_id;
    const clientUrl = process.env.CLIENT_URL || 'https://ai-billing-software-3.onrender.com';
    res.redirect(`${clientUrl}/app/dashboard?payment=failure&order_id=${orderId}`);
};
export const verifyPaymentSuccess = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        const { orderId, plan, period } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (!orderId || !plan || !period) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        try {
            const response = await cashfreeAxios.get(`${CASHFREE_BASE_URL.replace('/pg', '')}/pg/orders/${orderId}`, {
                headers: {
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY,
                    'x-api-version': '2023-08-01',
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.order_status === 'PAID') {
                let profile = await BusinessProfile.findOne({ owner: userId });

                if (!profile) {
                    profile = new BusinessProfile({ owner: userId, businessName: 'My Business' });
                }

                if (profile.subscriptionStatus === 'active' && profile.subscriptionPlan === plan) {
                    return res.status(200).json({ success: true, message: 'Subscription already active' });
                }

                profile.subscriptionPlan = plan;
                profile.subscriptionPeriod = period;
                profile.subscriptionStatus = 'active';

                const now = new Date();
                if (period === 'annual') {
                    now.setFullYear(now.getFullYear() + 1);
                } else {
                    now.setMonth(now.getMonth() + 1);
                }
                profile.subscriptionEndDate = now;

                await profile.save();
                console.log(`Verified order ${orderId} successfully for user ${userId}. Status is PAID.`);
                return res.status(200).json({ success: true, message: 'Subscription activated' });
            } else {
                return res.status(400).json({ success: false, message: `Payment not completed. Status: ${response?.data?.order_status}` });
            }
        } catch (apiErr) {
            console.error("Failed to fetch order from Cashfree:", apiErr?.response?.data || apiErr.message);
            return res.status(500).json({ success: false, message: 'Failed to verify with payment gateway' });
        }
    } catch (error) {
        console.error("verifyPaymentSuccess Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
