'use server';

// Explicitly load env if Next.js fails to (common on some Windows setups)
import 'dotenv/config';

/**
 * Razorpay Order Initiation Protocol.
 * Securely creates orders on the backend to prevent tampering.
 */
export async function createRazorpayOrderAction(amountINR: number) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const envKeys = Object.keys(process.env).filter(k => k.includes('RAZORPAY'));
    console.error('[Razorpay Action] Critical: RAZORPAY_KEY_ID or SECRET is missing. Found keys:', envKeys);
    return { 
      success: false, 
      error: `Razorpay configuration not detected (Found keys: ${envKeys.join(', ') || 'None'}). Please ensure .env keys are set and RESTART your dev server.` 
    };
  }

  try {
    // Basic Auth for Razorpay API
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: amountINR * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      })
    });

    const data = await response.json();
    
    if (data.id) {
      return { success: true, orderId: data.id, amount: data.amount, keyId };
    } else {
      return { success: false, error: data.error?.description || 'Order creation failed' };
    }
  } catch (err: any) {
    console.error('[Razorpay Action] Error:', err);
    return { success: false, error: 'Network error during order initiation' };
  }
}
