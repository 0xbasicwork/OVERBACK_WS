const assert = require('assert');
const APIHandler = require('./api-handler');

async function testAPI() {
    console.log('Starting API tests...');
    const api = new APIHandler();

    try {
        // Test 1: Save index score
        console.log('\nTest 1: Saving index score...');
        const testScore = {
            score: 56,
            components: {
                market: 65,
                social: 50,
                onChain: 50
            }
        };
        await api.saveIndexScore(testScore.score, testScore.components);

        // Test 2: Get console data
        console.log('\nTest 2: Getting console data...');
        const consoleData = await api.getConsoleData();
        assert(consoleData.current_score > 0, 'Score should be greater than 0');
        assert(consoleData.trend, 'Trend should be present');
        console.log('Console data:', consoleData);

        // Test 3: Save daily summary
        console.log('\nTest 3: Saving daily summary...');
        const testSummary = {
            score: 85.5,
            timestamp: new Date().toISOString(),
            components: {
                market: 65,
                social: 50,
                onChain: 50
            }
        };
        await api.saveDailySummary(testSummary);

        // Test 4: Get console history
        console.log('\nTest 4: Getting console history...');
        const history = await api.getConsoleHistory(7);
        assert(Array.isArray(history), 'History should be an array');
        console.log(`Found ${history.length} historical entries`);

        // Test 5: Verify trend calculation
        console.log('\nTest 5: Testing trend calculation...');
        const scores = [80, 82, 85, 83, 86];
        const trend = api.calculateTrend(scores);
        assert(['increasing', 'decreasing', 'stable'].includes(trend), 'Invalid trend value');
        console.log('Trend calculation:', trend);

        console.log('\nAll tests passed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        api.close();
    }
}

// Run tests if called directly
if (require.main === module) {
    testAPI().catch(console.error);
}

module.exports = { testAPI }; 