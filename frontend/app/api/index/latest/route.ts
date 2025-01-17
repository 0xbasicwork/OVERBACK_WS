import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
    try {
        const response = await axios.get(`${API_URL}/api/index/latest`);
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching index:', error);
        return NextResponse.json(
            { error: 'Failed to fetch index data' },
            { status: 500 }
        );
    }
} 