import { NextResponse } from 'next/server';
import { aiEchoFlow } from '@/ai/flows/ai-echo-chat';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await aiEchoFlow(body);
    return NextResponse.json({ text: result });
  } catch (error: any) {
    console.error('AI Echo API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
