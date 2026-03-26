import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).substring(7);
  console.log(`[Cashfree Webhook][${reqId}] Received new request`);
  
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    console.log(`[Cashfree Webhook][${reqId}] Headers - Signature: ${!!signature}, Timestamp: ${timestamp}`);

    if (!signature || !timestamp) {
      console.warn(`[Cashfree Webhook][${reqId}] Rejected: Missing headers`);
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.error(`[Cashfree Webhook][${reqId}] ERROR: CASHFREE_SECRET_KEY is undefined`);
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const computePayload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(computePayload)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error(`[Cashfree Webhook][${reqId}] ERROR: Signature Mismatch. Expected: ${expectedSignature.substring(0, 5)}..., Got: ${signature.substring(0, 5)}...`);
      // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // LOG and continue for debugging if needed, but safer to reject
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log(`[Cashfree Webhook][${reqId}] Payload Type: ${payload.type}`);
    
    // For V3, the data is inside payload.data
    const data = payload.data;
    if (!data || !data.order) {
       console.warn(`[Cashfree Webhook][${reqId}] Rejected: No order data in payload`);
       return NextResponse.json({ status: 'no_data' });
    }

    const { order } = data;
    console.log(`[Cashfree Webhook][${reqId}] Order ID: ${order.order_id}, Status: ${order.order_status}`);

    if (order.order_status === 'PAID') {
      const orderId = order.order_id;
      const customerId = order.customer_details?.customer_id;
      const amountPaid = order.order_amount;

      if (!customerId) {
        console.error(`[Cashfree Webhook][${reqId}] ERROR: customer_id missing in order details`);
        return NextResponse.json({ error: 'customer_id missing' }, { status: 400 });
      }

      const COIN_PACKAGES = [
        { id: 'p1', amount: 50000, price: 10 },
        { id: 'p2', amount: 500000, price: 100 },
        { id: 'p3', amount: 2500000, price: 500, bonus: 250000 },
        { id: 'p4', amount: 5000000, price: 1000, bonus: 750000 },
        { id: 'p5', amount: 12500000, price: 2500, bonus: 2500000 },
        { id: 'p6', amount: 50000000, price: 10000, bonus: 13500000 },
        { id: 'p7', amount: 10000, price: 1, bonus: 200 },
      ];

      const pkg = COIN_PACKAGES.find(p => p.price === amountPaid);
      let totalGain = amountPaid * 5000;
      if (pkg) {
        totalGain = pkg.amount + (pkg.bonus || 0);
      } else if (amountPaid === 1) {
        totalGain = 10200;
      }

      console.log(`[Cashfree Webhook][${reqId}] Processing credit: ${totalGain} coins for user ${customerId}`);

      // Idempotency check
      const historyRef = adminDb.collection('users').doc(customerId).collection('diamondExchanges');
      const existingQuery = await historyRef.where('orderId', '==', orderId).get();

      if (!existingQuery.empty) {
        console.log(`[Cashfree Webhook][${reqId}] Order ${orderId} already processed. Skipping.`);
        return NextResponse.json({ status: 'already_processed' });
      }

      // Atomic Update
      const userRef = adminDb.collection('users').doc(customerId);
      const profileRef = userRef.collection('profile').doc(customerId);

      const batch = adminDb.batch();
      
      batch.update(userRef, { 
        'wallet.coins': admin.firestore.FieldValue.increment(totalGain), 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      batch.update(profileRef, { 
        'wallet.coins': admin.firestore.FieldValue.increment(totalGain), 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      batch.add(historyRef, {
        type: 'purchase',
        coinAmount: totalGain,
        provider: 'cashfree_webhook',
        orderId: orderId,
        amountPaid: amountPaid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      console.log(`[Cashfree Webhook][${reqId}] SUCCESS: Credited ${totalGain} coins to user ${customerId}`);
    } else {
       console.log(`[Cashfree Webhook][${reqId}] Ignored: Status is ${order.order_status}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error(`[Cashfree Webhook][${reqId}] CRITICAL ERROR:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
