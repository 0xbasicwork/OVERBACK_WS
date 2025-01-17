import fs from 'fs/promises';
import path from 'path';

const MAINTENANCE_FILE = path.join(process.cwd(), '.env.local');
const API_KEY = process.env.MAINTENANCE_API_KEY;

export async function POST(request) {
    try {
        const { enabled, key } = await request.json();
        
        // Verify API key
        if (key !== API_KEY) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update maintenance mode
        await fs.writeFile(MAINTENANCE_FILE, `NEXT_PUBLIC_MAINTENANCE_MODE=${enabled}`);

        return Response.json({ maintenance: enabled });
    } catch (error) {
        console.error('Failed to update maintenance mode:', error);
        return Response.json({ error: 'Failed to update maintenance mode' }, { status: 500 });
    }
} 