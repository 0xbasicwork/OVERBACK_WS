const express = require('express');
const router = express.Router();
const MarketDatabase = require('../database');
const DataStorage = require('../data-storage');
const { formatDateUTC } = require('../utils/dateFormatter');

// GET /api/latest - Get latest index data
router.get('/latest', async (req, res) => {
    const db = new MarketDatabase();
    db.initialize();
    try {
        const latest = db.db.prepare(`
            SELECT * FROM index_scores 
            ORDER BY timestamp DESC 
            LIMIT 1
        `).get();
        res.json(latest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        db.close();
    }
});

// GET /api/trends - Get trend analysis
router.get('/trends', async (req, res) => {
    const storage = new DataStorage();
    try {
        const trend = await storage.getTrend();
        res.json({ trend });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/console - Get console-friendly current status
router.get('/console', async (req, res) => {
    try {
        const stmt = db.db.prepare(`
            SELECT * FROM index_scores 
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        const latest = stmt.get();

        let output = '=== Current Index Status ===\n\n';
        const components = JSON.parse(latest.components || '{}');
        output += `Score: ${latest.score.toFixed(2)}\n`;
        output += `Last Updated: ${formatDate(new Date(latest.timestamp))}\n`;
        output += '\nComponents:\n';
        output += `  Market:    ${(components.market_cap || 0).toFixed(2)}%\n`;
        output += `  Sentiment: ${(components.social || 0).toFixed(2)}%\n`;
        output += `  On-Chain:  ${(components.volume || 0).toFixed(2)}%\n`;

        res.type('text/plain').send(output);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// GET /api/console/history - Get console-friendly history
router.get('/console/history', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const endDate = new Date();
        const startDate = new Date(endDate - days * 24 * 60 * 60 * 1000);

        const stmt = db.db.prepare(`
            SELECT i.*, d.market_stats, d.social_stats
            FROM index_scores i
            LEFT JOIN daily_summaries d ON DATE(i.timestamp) = d.date
            WHERE i.timestamp BETWEEN ? AND ?
            ORDER BY i.timestamp DESC
        `);
        
        const scores = stmt.all(startDate.toISOString(), endDate.toISOString());

        let output = `=== Index History (Last ${days} days) ===\n\n`;

        scores.forEach(entry => {
            const components = JSON.parse(entry.components || '{}');
            output += `Date: ${formatDate(new Date(entry.timestamp))}\n`;
            output += `Total Score: ${entry.score.toFixed(2)}\n`;
            output += 'Components:\n';
            output += `  Market:    ${(components.market_cap || 0).toFixed(2)}%\n`;
            output += `  Sentiment: ${(components.social || 0).toFixed(2)}%\n`;
            output += `  On-Chain:  ${(components.volume || 0).toFixed(2)}%\n`;
            output += '-------------------\n';
        });

        if (scores.length > 1) {
            const latest = scores[0].score;
            const oldest = scores[scores.length - 1].score;
            const change = latest - oldest;
            output += '\nTrend Analysis:\n';
            output += `Change over ${days} days: ${change > 0 ? '+' : ''}${change.toFixed(2)}\n`;
            output += `Average Score: ${(scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(2)}\n`;
        }

        res.type('text/plain').send(output);
    } catch (error) {
        res.status(500).send('Error retrieving history: ' + error.message);
    }
});

module.exports = router; 