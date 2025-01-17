import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Mock data for build time
const mockData = {
    history: [
        {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            message: 'Build time mock data',
            type: 'info'
        }
    ]
};

export async function GET() {
    // During build time or when API is not available, return mock data
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
        return NextResponse.json(mockData);
    }

    try {
        const response = await axios.get(`${API_URL}/api/console/history`);
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('API error:', error);
        // Return mock data in case of error
        return NextResponse.json(mockData);
    }
} 