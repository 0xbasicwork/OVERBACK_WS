const MarketDatabase = require('./database');

class APIHandler {
    constructor() {
        this.db = new MarketDatabase();
        this.db.initialize();
    }

    async getConsoleData() {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime - 7 * 24 * 60 * 60 * 1000);

            const stmt = this.db.db.prepare(`
                SELECT * FROM index_scores 
                WHERE timestamp BETWEEN ? AND ?
                ORDER BY timestamp DESC
                LIMIT 1
            `);

            const latestScore = stmt.get(startTime.toISOString(), endTime.toISOString());
            
            // Get trend from index_scores instead of daily_summaries
            const trendStmt = this.db.db.prepare(`
                SELECT score FROM index_scores
                WHERE timestamp BETWEEN ? AND ?
                ORDER BY timestamp ASC
            `);
            
            const scores = trendStmt.all(startTime.toISOString(), endTime.toISOString());
            const trend = this.calculateTrend(scores.map(s => s.score));

            return {
                current_score: latestScore?.score || 0,
                trend,
                components: latestScore?.components ? JSON.parse(latestScore.components) : {},
                timestamp: latestScore?.timestamp || new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get console data:', error);
            throw error;
        }
    }

    async getConsoleHistory(days = 30) {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime - days * 24 * 60 * 60 * 1000);

            const stmt = this.db.db.prepare(`
                SELECT timestamp, score, components
                FROM index_scores
                WHERE timestamp BETWEEN ? AND ?
                ORDER BY timestamp DESC
            `);

            const history = stmt.all(startTime.toISOString(), endTime.toISOString());

            return history.map(entry => ({
                timestamp: entry.timestamp,
                score: entry.score,
                components: JSON.parse(entry.components || '{}')
            }));
        } catch (error) {
            console.error('Failed to get console history:', error);
            throw error;
        }
    }

    calculateTrend(scores) {
        if (scores.length < 2) return 'insufficient_data';

        const latest = scores[scores.length - 1];
        const previous = scores[0];
        const change = latest - previous;

        if (Math.abs(change) < 5) return 'stable';
        return change > 0 ? 'increasing' : 'decreasing';
    }

    async saveIndexScore(score, components) {
        const stmt = this.db.db.prepare(`
            INSERT INTO index_scores (timestamp, score, components)
            VALUES (?, ?, ?)
        `);
        
        try {
            stmt.run(
                new Date().toISOString(),
                score,
                JSON.stringify(components)
            );
        } catch (error) {
            console.error('Failed to save index score:', error);
            throw error;
        }
    }

    async saveDailySummary(summaryData, marketStats = {}, socialStats = {}) {
        try {
            const stmt = this.db.db.prepare(`
                INSERT INTO daily_summaries (date, summary_data, market_stats, social_stats)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(date) DO UPDATE SET
                    summary_data = excluded.summary_data,
                    market_stats = excluded.market_stats,
                    social_stats = excluded.social_stats
            `);

            stmt.run(
                new Date().toISOString().split('T')[0],
                JSON.stringify(summaryData),
                JSON.stringify(marketStats),
                JSON.stringify(socialStats)
            );
        } catch (error) {
            console.error('Failed to save daily summary:', error);
            throw error;
        }
    }

    close() {
        this.db.close();
    }
}

module.exports = APIHandler; 