'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
// Removed top-level Cashfree import

// Razorpay Config
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) ? new Razorpay({
 key_id: RAZORPAY_KEY_ID,
 key_secret: RAZORPAY_KEY_SECRET,
 }) : null;

// Cashfree Config
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_MODE = process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox";

// Cashfree initialization helper to avoid top-level errors during build
let cashfreeInstance: any = null;

async function getCashfreeInstance() {
 if (cashfreeInstance) return cashfreeInstance;
 
 const app_id = process.env.CASHFREE_APP_ID;
 const secret_key = process.env.CASHFREE_SECRET_KEY;
 const CASHFREE_MODE = process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox";
 
 if (!app_id || !secret_key) {
  console.warn('[Payment Sync] Cashfree credentials missing in environment.');
  return null;
 }

 // Dynamic import to prevent build-time resolution issues
 const { Cashfree, CFEnvironment } = await import('cashfree-pg');

 cashfreeInstance = new Cashfree(
  CASHFREE_MODE === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  app_id,
  secret_key
 );
 return cashfreeInstance;
}

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
  console.error('[Payment Sync] Razorpay Order Error:', error);
  return { success: false, error: 'Failed to initialize payment frequency.' };
 }
}

export async function createCashfreeOrderAction(amount: number, userDetails: { id: string, name: string, email: string }) {
 try {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const request = {
   order_amount: amount,
   order_currency: "INR",
   order_id: orderId,
   customer_details: {
    customer_id: userDetails.id || `cust_${Date.now()}`,
    customer_phone: "9999999999", // placeholder as required
    customer_name: userDetails.name || 'Valued User',
    customer_email: userDetails.email || 'user@example.com'
   },
   order_meta: {
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/wallet?order_id={order_id}`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/webhooks/cashfree`
   }
  };

  const instance = await getCashfreeInstance();
  if (!instance) return { success: false, error: 'Cashfree configuration missing.' };

  const response = await instance.PGCreateOrder(request);
  
  if (response.data) {
   return { 
    success: true, 
    paymentSessionId: response.data.payment_session_id,
    orderId: response.data.order_id 
   };
  }

  return { success: false, error: 'Failed to generate session' };
 } catch (error: any) {
  console.error('[Payment Sync] Cashfree Order Error:', error?.response?.data || error);
  return { success: false, error: error?.response?.data?.message || 'Cashfree frequency synchronization failed.' };
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
  console.log(`[Payment Sync] Signature mismatch for order: ${razorpay_order_id}`);
  return { success: false, error: 'Payment signature frequency mismatch.' };
 }
}
export async function verifyCashfreeOrderAction(order_id: string) {
  console.log(`[Payment Action] Verifying Cashfree Order: ${order_id}`);
  try {
    const instance = await getCashfreeInstance();
    if (!instance) {
      console.error('[Payment Action] Cashfree instance failed to initialize');
      return { success: false, error: 'Cashfree configuration missing.' };
    }

    const response = await instance.PGFetchOrder(order_id);
    const data = response.data;
    console.log(`[Payment Action] Cashfree Response for ${order_id}:`, {
      order_id: data?.order_id,
      order_status: data?.order_status,
      order_amount: data?.order_amount
    });

    if (data && data.order_status === "PAID") {
      return { 
        success: true, 
        order_id: data.order_id, 
        order_amount: data.order_amount,
        customer_id: data.customer_details?.customer_id 
      };
    }

    return { 
      success: false, 
      error: `Order status is ${data?.order_status || 'unknown'}`,
      status: data?.order_status,
      raw: data 
    };
  } catch (error: any) {
    const errorData = error?.response?.data || error;
    console.error('[Payment Action] Cashfree Verification Critical Error:', errorData);
    return { success: false, error: 'Verification synchronization failed.', detail: errorData };
  }
}
