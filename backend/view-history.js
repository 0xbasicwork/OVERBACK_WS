const MarketDatabase = require('./database');
const { formatDateUTC } = require('./utils/dateFormatter');

async function viewHistory(days = 7) {
    console.log(`\n=== Index History (Last ${days} days) ===\n`);
    
    const db = new MarketDatabase();
    db.initialize();

    try {
        // Get historical scores with components
        const scores = db.db.prepare(`
            SELECT timestamp, score, components
            FROM index_scores
            WHERE timestamp > date('now', ?)
            ORDER BY timestamp DESC
        `).all(`-${days} days`);

        scores.forEach(entry => {
            const components = JSON.parse(entry.components);
            console.log(`Date: ${formatDateUTC(new Date(entry.timestamp))}`);
            console.log(`Total Score: ${entry.score.toFixed(2)}`);
            console.log('Components:');
            console.log(`  Market:    ${(components.market?.total || 0).toFixed(2)}%`);
            console.log(`  Sentiment: ${(components.social?.total || 0).toFixed(2)}%`);
            console.log(`  On-Chain:  ${(components.onchain?.total || 0).toFixed(2)}%`);
            console.log('-------------------');
        });

        // Show trend analysis
        if (scores.length > 1) {
            const latest = scores[0].score;
            const oldest = scores[scores.length - 1].score;
            const change = latest - oldest;
            console.log('\nTrend Analysis:');
            console.log(`Change over ${days} days: ${change > 0 ? '+' : ''}${change.toFixed(2)}`);
            console.log(`Average Score: ${(scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(2)}`);
        }

    } catch (error) {
        console.error('Error viewing history:', error);
    } finally {
        db.close();
    }
}

// View last 7 days by default
viewHistory();

// Can also specify number of days:
// viewHistory(30);  // View last 30 days 