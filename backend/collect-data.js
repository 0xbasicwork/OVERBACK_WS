const CoinGecko = require('./coingecko');
const { SolanaDataCollector } = require('./solana-data');
const MarketDatabase = require('./database');

async function collectData() {
    try {
        console.log('Starting data collection...');
        
        // 1. Get fresh market data
        const coingecko = new CoinGecko();
        const marketData = await coingecko.getMarketData();
        
        // 2. Get on-chain data
        const solana = new SolanaDataCollector();
        const onChainData = await solana.getAllMemecoinMetrics();
        
        // 3. Store everything
        const db = new MarketDatabase();
        await db.initialize();
        await db.storeMarketData(marketData);
        await db.storeOnChainData(onChainData);
        
        console.log('Data collection complete');
    } catch (error) {
        console.error('Data collection failed:', error);
    }
}

collectData().catch(console.error); 