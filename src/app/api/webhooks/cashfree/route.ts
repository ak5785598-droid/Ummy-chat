import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, increment, serverTimestamp, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase-admin'; // Use admin SDK for background updates if possible, or standard with service account

// Note: For Next.js App Router, we define a POST handler
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify signature
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
    const { order, payment } = data;

    if (order.order_status === 'PAID') {
      const orderId = order.order_id;
      const customerId = order.customer_details.customer_id;
      const amountPaid = order.order_amount;

      // Import COIN_PACKAGES logic (simplified for server side)
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

      // Check for idempotency (has this order been processed?)
      // We can check if an entry exists in diamondExchanges with this orderId
      // For brevity in this script, we'll assume standard firebase-admin setup or similar
      // Since I don't have the full admin setup here, I'll use the client-side imported DB 
      // but in a real webhook you should use a service account for reliability.
      
      const { db: firestore } = await import('@/firebase'); 
      if (!firestore) throw new Error('Firestore not initialized');

      // 1. Check if already processed
      const historyRef = collection(firestore, 'users', customerId, 'diamondExchanges');
      const q = query(historyRef, where('orderId', '==', orderId));
      const existing = await getDocs(q);

      if (!existing.empty) {
        console.log(`Order ${orderId} already processed. Skipping.`);
        return NextResponse.json({ status: 'already_processed' });
      }

      // 2. Update Wallet
      const userRef = doc(firestore, 'users', customerId);
      const profileRef = doc(firestore, 'users', customerId, 'profile', customerId);

      await updateDoc(userRef, { 
        'wallet.coins': increment(totalGain), 
        updatedAt: serverTimestamp() 
      });
      await updateDoc(profileRef, { 
        'wallet.coins': increment(totalGain), 
        updatedAt: serverTimestamp() 
      });

      // 3. Record History
      await addDoc(historyRef, {
        type: 'purchase',
        coinAmount: totalGain,
        provider: 'cashfree_webhook',
        orderId: orderId,
        amountPaid: amountPaid,
        timestamp: serverTimestamp()
      });

      console.log(`Successfully credited ${totalGain} coins to user ${customerId} via Webhook`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Cashfree Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
