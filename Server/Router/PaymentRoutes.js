import express from 'express';
import { requireAuth } from '@clerk/express';
import { createCheckoutSession, handleWebhook, handlePaymentSuccess, handlePaymentFailure, verifyPaymentSuccess } from '../Controlllers/PaymentController.js';

const router = express.Router();

router.post('/create-checkout-session', requireAuth(), createCheckoutSession);
router.post('/verify-success', requireAuth(), express.json(), verifyPaymentSuccess);
router.post('/webhook', express.json(), handleWebhook);
router.post('/success', express.urlencoded({ extended: true }), handlePaymentSuccess);
router.post('/failure', express.urlencoded({ extended: true }), handlePaymentFailure);

export default router;
