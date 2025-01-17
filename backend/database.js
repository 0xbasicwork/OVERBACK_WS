const Database = require('better-sqlite3');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);
const crypto = require('crypto');
const { format } = require('date-fns');

class MarketDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'market_data.db');
        this.db = null;
        this.retentionDays = 30;
    }

    async initialize() {
        if (!this.db) {
            const sqlite3 = require('better-sqlite3');
            this.db = new sqlite3('market.db');
            
            // Create all required tables
            this.db.exec(`
                -- Volume history table
                CREATE TABLE IF NOT EXISTS volume_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token_id TEXT NOT NULL,
                    volume REAL NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(token_id, timestamp)
                );

                CREATE INDEX IF NOT EXISTS idx_volume_history_token_time 
                ON volume_history(token_id, timestamp);

                -- Index scores table
                CREATE TABLE IF NOT EXISTS index_scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    score REAL NOT NULL,
                    label TEXT,
                    components JSON,
                    UNIQUE(timestamp)
                );

                -- Market data table
                CREATE TABLE IF NOT EXISTS market_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token_id TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    market_cap REAL,
                    volume REAL,
                    price REAL,
                    price_change_24h REAL,
                    market_cap_rank INTEGER,
                    UNIQUE(token_id, timestamp)
                );

                -- Create indexes
                CREATE INDEX IF NOT EXISTS idx_market_data_timestamp 
                ON market_data(timestamp);
                
                CREATE INDEX IF NOT EXISTS idx_index_scores_timestamp 
                ON index_scores(timestamp);

                -- On-chain data table
                CREATE TABLE IF NOT EXISTS on_chain_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    market_metrics JSON,
                    token_metrics JSON,
                    UNIQUE(timestamp)
                );

                -- Process logs table (ONLY ONE DEFINITION)
                CREATE TABLE IF NOT EXISTS process_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL
                );

                -- Daily summaries table
                CREATE TABLE IF NOT EXISTS daily_summaries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    summary_data JSON,
                    market_stats JSON,
                    social_stats JSON,
                    UNIQUE(date)
                );

                -- Create indexes
                CREATE INDEX IF NOT EXISTS idx_index_scores_timestamp 
                ON index_scores(timestamp);
                
                CREATE INDEX IF NOT EXISTS idx_daily_summaries_date 
                ON daily_summaries(date);
            `);
        }
    }

    setupTables() {
        // Tokens table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS tokens (
                id TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                contract_address TEXT UNIQUE,
                coingecko_id TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Market data table with compression
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS market_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_id TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                market_cap REAL,
                volume REAL,
                price REAL,
                price_change_24h REAL,
                market_cap_rank INTEGER,
                compressed_data BLOB,
                data_hash TEXT,
                FOREIGN KEY(token_id) REFERENCES tokens(id),
                UNIQUE(token_id, timestamp)
            )
        `).run();

        // Rankings history
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_id TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                rank INTEGER NOT NULL,
                FOREIGN KEY(token_id) REFERENCES tokens(id),
                UNIQUE(token_id, timestamp)
            )
        `).run();

        // Index scores table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS index_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME NOT NULL,
                score REAL NOT NULL,
                components JSON,
                metadata JSON,
                UNIQUE(timestamp)
            )
        `).run();

        // Daily summaries table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS daily_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                summary_data JSON,
                market_stats JSON,
                social_stats JSON,
                UNIQUE(date)
            )
        `).run();

        // Create indexes
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp)').run();
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_rankings_timestamp ON rankings(timestamp)').run();
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_index_scores_timestamp ON index_scores(timestamp)').run();
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date)').run();
    }

    async saveToken(token) {
        const stmt = this.db.prepare(`
            INSERT INTO tokens (id, symbol, contract_address, coingecko_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                contract_address = excluded.contract_address,
                coingecko_id = excluded.coingecko_id,
                last_updated = CURRENT_TIMESTAMP
        `);

        stmt.run(token.id, token.symbol, token.contract_address, token.coingecko_id);
    }

    async saveMarketData(tokenId, data) {
        try {
            // Validate data
            this.validateMarketData(data);

            // Compress the full data object
            const compressedData = await compress(JSON.stringify(data));
            const dataHash = this.calculateHash(data);

            const stmt = this.db.prepare(`
                INSERT INTO market_data (
                    token_id, timestamp, market_cap, volume, price,
                    price_change_24h, market_cap_rank, compressed_data, data_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(token_id, timestamp) DO UPDATE SET
                    market_cap = excluded.market_cap,
                    volume = excluded.volume,
                    price = excluded.price,
                    price_change_24h = excluded.price_change_24h,
                    market_cap_rank = excluded.market_cap_rank,
                    compressed_data = excluded.compressed_data,
                    data_hash = excluded.data_hash
            `);

            stmt.run(
                tokenId,
                new Date().toISOString(),
                data.market_cap,
                data.volume,
                data.price,
                data.price_change_24h,
                data.market_cap_rank,
                compressedData,
                dataHash
            );
        } catch (error) {
            console.error(`Failed to save market data for token ${tokenId}:`, error);
            throw error;
        }
    }

    async getMarketData(tokenId, startTime, endTime) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM market_data
                WHERE token_id = ? AND timestamp BETWEEN ? AND ?
                ORDER BY timestamp DESC
            `);

            const rows = stmt.all(tokenId, startTime.toISOString(), endTime.toISOString());

            return await Promise.all(rows.map(async row => {
                const decompressedData = await decompress(row.compressed_data);
                const fullData = JSON.parse(decompressedData);
                
                // Verify data integrity
                const calculatedHash = this.calculateHash(fullData);
                if (calculatedHash !== row.data_hash) {
                    throw new Error(`Data integrity check failed for token ${tokenId} at ${row.timestamp}`);
                }

                return {
                    ...fullData,
                    timestamp: row.timestamp
                };
            }));
        } catch (error) {
            console.error(`Failed to retrieve market data for token ${tokenId}:`, error);
            throw error;
        }
    }

    validateMarketData(data) {
        const requiredFields = ['market_cap', 'volume', 'price', 'price_change_24h', 'market_cap_rank'];
        const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            throw new Error(`Invalid market data: missing fields ${missingFields.join(', ')}`);
        }

        if (typeof data.market_cap !== 'number' || data.market_cap < 0) {
            throw new Error('Invalid market cap value');
        }

        if (typeof data.volume !== 'number' || data.volume < 0) {
            throw new Error('Invalid volume value');
        }

        if (typeof data.price !== 'number' || data.price < 0) {
            throw new Error('Invalid price value');
        }
    }

    calculateHash(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    cleanupOldData() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        const cutoffTimestamp = cutoffDate.toISOString();

        const deleteMarketData = this.db.prepare('DELETE FROM market_data WHERE timestamp < ?');
        const deleteRankings = this.db.prepare('DELETE FROM rankings WHERE timestamp < ?');

        const cleanup = this.db.transaction(() => {
            deleteMarketData.run(cutoffTimestamp);
            deleteRankings.run(cutoffTimestamp);
        });

        cleanup();
        this.db.pragma('vacuum');
    }

    getStats() {
        const stats = {
            totalRecords: 0,
            oldestRecord: null,
            newestRecord: null,
            compressionRatio: 0,
            dataIntegrityStatus: true
        };

        const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM market_data');
        stats.totalRecords = countStmt.get().count;

        const timeRangeStmt = this.db.prepare(`
            SELECT 
                MIN(timestamp) as oldest,
                MAX(timestamp) as newest
            FROM market_data
        `);
        const timeRange = timeRangeStmt.get();
        stats.oldestRecord = timeRange.oldest;
        stats.newestRecord = timeRange.newest;

        const sizeStmt = this.db.prepare(`
            SELECT 
                AVG(LENGTH(compressed_data)) as avg_compressed,
                AVG(LENGTH(market_cap) + LENGTH(volume) + LENGTH(price) + 
                    LENGTH(price_change_24h) + LENGTH(market_cap_rank)) as avg_raw
            FROM market_data
        `);
        const sizeStats = sizeStmt.get();
        stats.compressionRatio = sizeStats.avg_compressed / sizeStats.avg_raw;

        return stats;
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }

    getLatestScore() {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            console.log('Executing getLatestScore query...');
            const stmt = this.db.prepare(`
                SELECT 
                    score,
                    components,
                    timestamp
                FROM index_scores 
                ORDER BY timestamp DESC 
                LIMIT 1
            `);
            
            const result = stmt.get();
            console.log('Query result:', result);
            return result;
        } catch (error) {
            console.error('Error in getLatestScore:', error);
            throw error;
        }
    }

    getRecentScores(hours = 24) {
        const stmt = this.db.prepare(`
            SELECT score, timestamp 
            FROM index_scores 
            WHERE timestamp >= datetime('now', '-${hours} hours')
            ORDER BY timestamp DESC
        `);
        return stmt.all();
    }

    storeIndexData({ score, label, components, timestamp }) {
        const stmt = this.db.prepare(`
            INSERT INTO index_scores (timestamp, score, label, components)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(
            timestamp || new Date().toISOString(),
            score,
            label,
            JSON.stringify(components)
        );
    }

    async storeVolumeData(tokenId, volume, timestamp) {
        await this.initialize();  // Ensure DB is initialized
        const stmt = this.db.prepare(`
            INSERT INTO volume_history (token_id, volume, timestamp)
            VALUES (?, ?, ?)
        `);
        stmt.run(tokenId, volume, timestamp);
    }

    getVolume24hAgo(tokenId) {
        if (!this.db) return null;  // Handle uninitialized case
        const stmt = this.db.prepare(`
            SELECT volume 
            FROM volume_history 
            WHERE token_id = ? 
            AND timestamp <= datetime('now', '-24 hours')
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        return stmt.get(tokenId)?.volume;
    }

    async storeMarketData(marketData) {
        await this.initialize();
        const stmt = this.db.prepare(`
            INSERT INTO market_data (
                timestamp,
                price_change_percentage_24h,
                volume_change_24h,
                market_cap_change_percentage_24h,
                total_volume,
                market_cap,
                current_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            new Date().toISOString(),
            marketData.price_change_percentage_24h,
            marketData.volume_change_24h,
            marketData.market_cap_change_percentage_24h,
            marketData.total_volume,
            marketData.market_cap,
            marketData.current_price
        );
    }

    async storeOnChainData(onChainData) {
        await this.initialize();
        const stmt = this.db.prepare(`
            INSERT INTO on_chain_data (
                timestamp,
                market_metrics,
                token_metrics
            ) VALUES (?, ?, ?)
        `);
        
        stmt.run(
            new Date().toISOString(),
            JSON.stringify(onChainData.market_metrics),
            JSON.stringify(onChainData.token_metrics)
        );
    }

    async getCurrentProcessLogs() {
        const stmt = this.db.prepare(`
            SELECT timestamp, process_type, log_data
            FROM process_logs
            WHERE timestamp >= datetime('now', '-1 hour')
            ORDER BY timestamp DESC
        `);
        return stmt.all();
    }

    async getHistoricProcessLogs() {
        const stmt = this.db.prepare(`
            SELECT timestamp, process_type, log_data
            FROM process_logs
            WHERE timestamp < datetime('now', '-1 hour')
            ORDER BY timestamp DESC
            LIMIT 100
        `);
        return stmt.all();
    }

    async logProcess(type, data) {
        const stmt = this.db.prepare(`
            INSERT INTO process_logs (process_type, log_data, timestamp)
            VALUES (?, ?, datetime('now'))
        `);
        stmt.run(type, JSON.stringify(data));
    }

    async getLatestOnChainData() {
        const stmt = this.db.prepare(`
            SELECT timestamp, market_metrics, token_metrics 
            FROM on_chain_data
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        const result = stmt.get();
        if (result) {
            return {
                timestamp: result.timestamp,
                market_metrics: JSON.parse(result.market_metrics),
                token_metrics: JSON.parse(result.token_metrics)
            };
        }
        return null;
    }

    async getLatestMarketData() {
        const stmt = this.db.prepare(`
            SELECT * FROM market_data
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        return stmt.get();
    }

    getProcessLogs() {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const stmt = this.db.prepare(`
                SELECT timestamp, level, message 
                FROM process_logs 
                ORDER BY timestamp DESC 
                LIMIT 100
            `);
            const logs = stmt.all();
            console.log('Retrieved logs:', logs);
            
            return logs.map(log => 
                `[${log.timestamp}] ${log.level}: ${log.message}`
            ).join('\n') || 'No logs available';
        } catch (error) {
            console.error('Failed to get process logs:', error);
            return 'No logs available';
        }
    }

    logProcess(level, message) {
        try {
            // Make sure we're initialized
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            console.log('Attempting to log:', { level, message });

            const stmt = this.db.prepare(`
                INSERT INTO process_logs (level, message)
                VALUES (?, ?)
            `);

            const result = stmt.run(level, message);
            console.log('Log inserted:', result);

            return result;
        } catch (error) {
            console.error('Error in logProcess:', error);
            throw error;  // Re-throw to handle in the API
        }
    }
}

module.exports = MarketDatabase; 