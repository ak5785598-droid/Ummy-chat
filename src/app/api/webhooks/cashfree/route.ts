import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.error('CASHFREE_SECRET_KEY missing');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const computePayload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(computePayload)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('Cashfree Webhook Signature Mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { data } = payload;
    const { order } = data;

    if (order.order_status === 'PAID') {
      const orderId = order.order_id;
      const customerId = order.customer_details.customer_id;
      const amountPaid = order.order_amount;

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

      // Idempotency check with Admin SDK
      const historyRef = adminDb.collection('users').doc(customerId).collection('diamondExchanges');
      const existingQuery = await historyRef.where('orderId', '==', orderId).get();

      if (!existingQuery.empty) {
        console.log(`Order ${orderId} already processed. Skipping.`);
        return NextResponse.json({ status: 'already_processed' });
      }

      // Atomic Update with Admin SDK
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
      console.log(`Successfully credited ${totalGain} coins to user ${customerId} via Webhook`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Cashfree Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
