import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001'  // Local backend in development
    : process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
    try {
        const response = await axios.get(`${API_URL}/api/console`, {
            responseType: 'text'  // Important: expect text response
        });
        
        return new NextResponse(response.data, {
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error) {
        console.error('API error:', error);
        return new NextResponse('Failed to fetch console output', { 
            status: 500 
        });
    }
} 