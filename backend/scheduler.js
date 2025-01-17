const cron = require('node-cron');
const CoinGecko = require('./coingecko');
const { SolanaDataCollector } = require('./solana-data');
const MarketDatabase = require('./database');
const OverBackCalculator = require('./over-back-calculator');

// Schedule all data collection at 12:00 UTC daily
cron.schedule('0 12 * * *', async () => {
    try {
        console.log('Starting daily calculation...');
        
        // 1. Get fresh market data
        const coingecko = new CoinGecko();
        const marketData = await coingecko.getMarketData();
        
        // 2. Get on-chain data
        const solana = new SolanaDataCollector();
        const onChainData = await solana.getAllMemecoinMetrics();
        
        // 3. Calculate index
        const calculator = new OverBackCalculator();
        const result = await calculator.calculateIndex(
            marketData,
            onChainData.social,
            onChainData.onChain
        );

        // 4. Store everything
        const db = new MarketDatabase();
        await db.initialize();
        await db.storeMarketData(marketData);
        await db.storeOnChainData(onChainData);
        await db.storeIndexData(result);
        
        console.log('Daily calculation complete:', result);
    } catch (error) {
        console.error('Daily calculation failed:', error);
    }
});

console.log('Scheduler started - Running daily at 12:00 UTC'); 