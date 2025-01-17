const DataStorage = require('./data-storage');
const MarketDatabase = require('./database');
const fs = require('fs').promises;
const path = require('path');

async function checkAllStorage() {
    console.log('\n=== Checking All Storage Systems ===\n');

    // 1. Check File Storage
    console.log('=== File Storage ===');
    const storage = new DataStorage();
    await storage.initialize();
    
    try {
        const history = await storage.getHistory();
        console.log('History File Entries:', history.length);
        console.log('Latest Entry:', history[history.length - 1]);
        
        // Check data directory contents
        const dataDir = path.join(__dirname, 'data');
        const files = await fs.readdir(dataDir);
        console.log('\nData Directory Files:', files);
    } catch (error) {
        console.log('File Storage Error:', error.message);
    }

    // 2. Check Database
    console.log('\n=== Database Storage ===');
    const db = new MarketDatabase();
    db.initialize();

    try {
        // Check database stats
        const stats = db.getStats();
        console.log('\nDatabase Stats:');
        console.log('Total Records:', stats.totalRecords);
        console.log('Oldest Record:', stats.oldestRecord);
        console.log('Newest Record:', stats.newestRecord);

        // Check recent index scores
        console.log('\nRecent Index Scores:');
        const scores = db.db.prepare('SELECT * FROM index_scores ORDER BY timestamp DESC LIMIT 5').all();
        console.log(JSON.stringify(scores, null, 2));

        // Check daily summaries
        console.log('\nRecent Daily Summaries:');
        const summaries = db.db.prepare('SELECT * FROM daily_summaries ORDER BY date DESC LIMIT 5').all();
        console.log(JSON.stringify(summaries, null, 2));

        // Check token data
        console.log('\nTracked Tokens:');
        const tokens = db.db.prepare('SELECT * FROM tokens').all();
        console.log(JSON.stringify(tokens, null, 2));

    } catch (error) {
        console.log('Database Error:', error.message);
    } finally {
        db.close();
    }
}

// Run the check
checkAllStorage(); 