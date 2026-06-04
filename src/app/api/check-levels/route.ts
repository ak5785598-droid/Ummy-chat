import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const levelsSnap = await adminDb.collection('levels').get();
    const levels = levelsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(levels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
