import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://45.76.10.9:3000';

export async function GET() {
    try {
        const response = await axios.get(`${API_URL}/api/console/history`, {
            responseType: 'text'
        });
        return new NextResponse(response.data, {
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error) {
        console.error('API error:', error);
        return new NextResponse('Failed to fetch console history', { status: 500 });
    }
} 