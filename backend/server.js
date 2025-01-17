const express = require('express');
const cors = require('cors');
const MarketDatabase = require('./database');

const app = express();
app.use(cors());

const db = new MarketDatabase();

// Real endpoints
app.get('/api/index/latest', async (req, res) => {
    try {
        console.log('Initializing database...');
        await db.initialize();
        
        console.log('Getting latest score...');
        const latestScore = await db.getLatestScore();
        console.log('Latest score:', latestScore);
        
        if (!latestScore) {
            // Return empty state until real data is collected
            return res.json({
                score: 0,
                components: {
                    market: 0,
                    social: 0,
                    onChain: 0
                },
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            score: latestScore.score,
            components: JSON.parse(latestScore.components || '{}'),
            timestamp: latestScore.timestamp
        });
    } catch (error) {
        console.error('Failed to fetch latest score:', error);
        res.status(500).json({ 
            error: 'Failed to fetch latest score',
            details: error.message 
        });
    }
});

app.get('/api/index/history', async (req, res) => {
    try {
        await db.initialize();
        const [monthHistory, weekHistory, dayHistory] = await Promise.all([
            db.getRecentScores(30 * 24),  // 30 days
            db.getRecentScores(7 * 24),   // 1 week
            db.getRecentScores(24)        // 24 hours
        ]);
        
        res.json({
            month: monthHistory,
            week: weekHistory,
            day: dayHistory
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/console', async (req, res) => {
    try {
        await db.initialize();
        const logs = await db.getProcessLogs();
        res.type('text/plain').send(logs || 'No logs available');
    } catch (error) {
        console.error('Failed to fetch console output:', error);
        res.status(500).type('text/plain').send('Failed to fetch console output');
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend API server running on port ${PORT}`);
}); 