'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * @fileOverview High-Fidelity Payment Sync Actions.
 * Handles secure order creation and signature verification via Razorpay.
 */

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) ? new Razorpay({
 key_id: RAZORPAY_KEY_ID,
 key_secret: RAZORPAY_KEY_SECRET,
}) : null;

export async function createOrderAction(amount: number) {
 if (!razorpay || !RAZORPAY_KEY_ID) {
  return { success: false, error: 'Razorpay configuration missing.' };
 }

 const options = {
  amount: amount * 100, // Amount in paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`,
 };

 try {
  const order = await razorpay.orders.create(options);
  return { success: true, orderId: order.id, amount: order.amount, keyId: RAZORPAY_KEY_ID };
 } catch (error: any) {
  console.error('[Payment Sync] Order Creation Error:', error);
  return { success: false, error: 'Failed to initialize payment frequency.' };
 }
}

export async function verifyPaymentAction(
 razorpay_order_id: string,
 razorpay_payment_id: string,
 razorpay_signature: string
) {
 if (!RAZORPAY_KEY_SECRET) {
  return { success: false, error: 'Verification secret missing.' };
 }

 const body = razorpay_order_id + "|" + razorpay_payment_id;
 const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(body.toString())
  .digest('hex');

 const isAuthentic = expectedSignature === razorpay_signature;

 if (isAuthentic) {
  console.log(`[Payment Sync] Verification successful for payment: ${razorpay_payment_id}`);
  return { success: true };
 } else {
  console.error(`[Payment Sync] Signature mismatch for order: ${razorpay_order_id}`);
  return { success: false, error: 'Payment signature frequency mismatch.' };
 }
}
