const OverBackCalculator = require('./over-back-calculator');
const CoinGecko = require('./coingecko');
const DataStorage = require('./data-storage');

async function manualUpdate(options = {}) {
    try {
        console.log('Starting manual index update...');
        
        // Get fresh market data
        const coingecko = new CoinGecko();
        const marketData = await coingecko.getMarketData();
        console.log('Fresh market data:', marketData);

        // Initialize and get current data for comparison
        const storage = new DataStorage();
        await storage.initialize();
        
        const latestScore = await storage.getLatest();
        console.log('Current index:', latestScore);

        // Calculate new score
        const calculator = new OverBackCalculator();
        const result = await calculator.calculateIndex(
            marketData,
            latestScore?.components?.social || { total: 50 },
            latestScore?.components?.onChain || { total: 50 }
        );

        // Always save unless explicitly told not to
        if (options.test !== true) {
            await storage.storeIndexData(result);
            const latest = await storage.getLatest();
            console.log('Index updated in storage:', {
                score: result.score,
                label: latest.label,
                components: result.components
            });
        }

        return result;
    } catch (error) {
        console.error('Update failed:', error);
        throw error;
    }
}

// CLI support for testing
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        test: args.includes('--test'),  // Only use --test to prevent saving
        weights: args.includes('--custom-weights') ? {
            // Add custom weights here if needed
        } : undefined
    };
    
    manualUpdate(options).catch(console.error);
}

module.exports = manualUpdate; 