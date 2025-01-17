const MarketDatabase = require('./database');
const { CORE_TOKENS } = require('./token-config');

async function testDatabase() {
    const db = new MarketDatabase();
    
    try {
        console.log('\n=== Testing Enhanced Database Implementation ===\n');
        
        // Initialize database
        console.log('Initializing database...');
        db.initialize();
        
        // Save token information
        console.log('\nSaving token information...');
        for (const [symbol, token] of Object.entries(CORE_TOKENS)) {
            await db.saveToken({
                id: symbol,
                symbol: symbol,
                contract_address: token.contract,
                coingecko_id: token.coingeckoId
            });
        }

        // Test market data insertion
        console.log('\nSaving test market data...');
        const testData = {
            market_cap: 1000000000,
            volume: 50000000,
            price: 0.00001234,
            price_change_24h: 5.67,
            market_cap_rank: 150,
            additional_data: {
                social_volume: 1234,
                github_activity: 56,
                developer_score: 78
            }
        };

        await db.saveMarketData('BONK', testData);
        
        // Test data retrieval
        console.log('\nRetrieving market data...');
        const endTime = new Date();
        const startTime = new Date(endTime - 24 * 60 * 60 * 1000); // Last 24 hours
        const marketData = await db.getMarketData('BONK', startTime, endTime);
        
        console.log('\n=== Retrieved Data ===');
        console.log('Records found:', marketData.length);
        if (marketData.length > 0) {
            console.log('Latest record:', {
                timestamp: marketData[0].timestamp,
                market_cap: marketData[0].market_cap,
                price: marketData[0].price,
                volume: marketData[0].volume,
                additional_data: marketData[0].additional_data
            });
        }

        // Get database stats
        console.log('\n=== Database Statistics ===');
        const stats = db.getStats();
        console.log('Total Records:', stats.totalRecords);
        console.log('Data Range:', new Date(stats.oldestRecord), 'to', new Date(stats.newestRecord));
        console.log('Compression Ratio:', ((1 - stats.compressionRatio) * 100).toFixed(2) + '% savings');
        console.log('Data Integrity:', stats.dataIntegrityStatus ? 'Valid' : 'Issues Found');

        // Test data validation
        console.log('\n=== Testing Data Validation ===');
        try {
            await db.saveMarketData('BONK', { 
                market_cap: -1000 // Invalid negative value
            });
        } catch (error) {
            console.log('Validation correctly caught invalid data:', error.message);
        }

    } catch (error) {
        console.error('Test failed:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        // Clean up
        db.close();
    }
}

// Run the test
testDatabase(); 