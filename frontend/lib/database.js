export async function getLatestScore() {
    try {
        // Connect to your SQLite database
        const db = await openDatabase();
        const latestScore = await db.getLatestScore();
        return latestScore;
    } catch (error) {
        console.error('Failed to get latest score:', error);
        throw error;
    }
} 