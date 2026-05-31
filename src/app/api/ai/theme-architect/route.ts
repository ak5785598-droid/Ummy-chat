import { NextResponse } from 'next/server';
import { generateThemeCssFlow } from '@/ai/flows/generate-theme-css';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await generateThemeCssFlow(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Theme API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
