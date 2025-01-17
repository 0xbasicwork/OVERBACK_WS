const MarketDatabase = require('./database');

async function checkDatabase() {
    const db = new MarketDatabase();
    await db.initialize();
    
    // Check latest score
    const latestScore = db.getLatestScore();
    console.log('Latest Score in DB:', latestScore);
    
    // Check recent scores
    const recentScores = db.getRecentScores(24);
    console.log('Recent Scores:', recentScores);
}

checkDatabase().catch(console.error); 