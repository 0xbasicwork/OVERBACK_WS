const CoinGecko = require('./coingecko');

async function testCoinGecko() {
    try {
        console.log('\n=== Testing Enhanced CoinGecko API ===\n');
        
        const coingecko = new CoinGecko();
        await coingecko.initialize();
        
        console.log('Fetching market data...');
        const marketData = await coingecko.getMarketData();
        
        console.log('\n=== Basic Information ===');
        console.log('Raw Market Data:', marketData);

        // Test volume metrics
        console.log('\n=== Volume Metrics ===');
        if (marketData.total_volume) {
            console.log('Total Volume:', marketData.total_volume.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            }));
        } else {
            console.log('No volume data available');
        }

        // Test price metrics
        console.log('\n=== Price Metrics ===');
        console.log('24h Price Change:', marketData.price_change_percentage_24h?.toFixed(2) + '%' || 'N/A');
        
        // Test market cap metrics
        console.log('\n=== Market Cap Metrics ===');
        if (marketData.market_cap) {
            console.log('Market Cap:', marketData.market_cap.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            }));
            console.log('Market Cap Change:', marketData.market_cap_change_percentage_24h?.toFixed(2) + '%' || 'N/A');
        } else {
            console.log('No market cap data available');
        }

        // Test data validation
        console.log('\n=== Data Validation ===');
        const validationResults = {
            hasVolume: Boolean(marketData.total_volume),
            hasPrice: Boolean(marketData.current_price),
            hasMarketCap: Boolean(marketData.market_cap),
            hasPriceChange: Boolean(marketData.price_change_percentage_24h),
            hasMarketCapChange: Boolean(marketData.market_cap_change_percentage_24h)
        };
        console.log('Validation Results:', validationResults);

    } catch (error) {
        console.error('Test failed:', error);
        if (process.env.DEBUG_MODE === 'true') {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testCoinGecko(); 