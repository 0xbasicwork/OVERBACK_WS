import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://45.76.10.9:3000';
    const response = await fetch(`${API_URL}/api/trend`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Trend API Error:', error);
    return NextResponse.json({ trend: 'neutral', confidence: 0 });
  }
} 