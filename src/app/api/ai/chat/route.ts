import { NextRequest, NextResponse } from 'next/server';
import { getUmmyAIResponse } from '@/actions/ai-actions';

export async function POST(request: NextRequest) {
  try {
    const { message, userName } = await request.json();

    if (!message || !userName) {
      return NextResponse.json({ error: 'Message and userName are required' }, { status: 400 });
    }

    // Call the same AI flow that the Web app uses
    const aiResponse = await getUmmyAIResponse(message, userName);

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Error in AI Chat API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
