const MarketDatabase = require('./database');

async function checkScores() {
    const db = new MarketDatabase();
    await db.initialize();

    // Check recent scores
    const recentScores = db.getRecentScores(30 * 24); // Last 30 days
    console.log('\nRecent Scores:', recentScores);

    // Get latest index data with components
    const latestScore = db.getLatestScore();
    console.log('\nLatest Index Score:', {
        timestamp: latestScore?.timestamp,
        score: latestScore?.score,
        components: latestScore?.components ? JSON.parse(latestScore.components) : null
    });

    try {
        // Get latest on-chain data
        const latestOnChain = db.getLatestOnChainData();
        console.log('\nLatest On-Chain Data:', latestOnChain);
    } catch (error) {
        console.log('\nNo on-chain data found');
    }

    // Also check market data
    const latestMarket = db.getLatestMarketData();
    if (latestMarket) {
        console.log('\nLatest Market Data:', latestMarket);
    } else {
        console.log('\nNo market data found');
    }
}

checkScores().catch(console.error); 