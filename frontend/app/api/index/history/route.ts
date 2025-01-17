import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://45.76.10.9:3000';

export async function GET() {
    try {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({
                month: [],
                week: [],
                day: []
            });
        }

        const response = await axios.get(`${API_URL}/api/index/history`);
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            month: [],
            week: [],
            day: []
        });
    }
} 