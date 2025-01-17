import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://45.76.10.9:3001';

// Mock data for build time
const mockData = {
    status: 'ok',
    message: 'Mock console status'
};

export async function GET() {
    // Always return mock data during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return NextResponse.json(mockData);
    }

    try {
        const response = await axios.get(`${API_URL}/api/console`);
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching console status:', error);
        // Return mock data in case of error
        return NextResponse.json(mockData);
    }
} 