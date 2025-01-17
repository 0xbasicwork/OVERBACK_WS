const DataStorage = require('./data-storage');
const APIHandler = require('./api-handler');
const { CORE_TOKENS } = require('./token-config');
const sqlite3 = require('better-sqlite3');

async function migrateData() {
    console.log('Starting data migration...');
    
    const oldStorage = new DataStorage();
    const api = new APIHandler();
    const db = new sqlite3('market.db');

    try {
        // Add volume_history table
        console.log('Creating volume_history table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS volume_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_id TEXT NOT NULL,
                volume REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(token_id, timestamp)
            );

            CREATE INDEX IF NOT EXISTS idx_volume_history_token_time 
            ON volume_history(token_id, timestamp);
        `);

        // Migrate historical data
        const history = await oldStorage.getHistory();
        console.log(`Found ${history.length} historical entries to migrate`);

        for (const entry of history) {
            const { timestamp, score, components = {}, metadata = {} } = entry;
            await api.saveIndexScore(score, components, metadata);
        }

        // Migrate latest data for daily summary
        const latest = await oldStorage.getLatest();
        if (latest) {
            const marketStats = {
                total_market_cap: latest.marketCap || 0,
                total_volume: latest.volume || 0,
                market_dominance: latest.dominance || {}
            };

            const summaryData = {
                score: latest.score,
                timestamp: latest.timestamp,
                trend: latest.trend
            };

            await api.saveDailySummary(summaryData, marketStats);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        api.close();
        db.close();
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateData().catch(console.error);
}

module.exports = { migrateData }; 