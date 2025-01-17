const { SolanaDataCollector } = require('./solana-data');

class OverBackCalculator {
    // Core weights for final index
    static WEIGHTS = {
        MARKET_DATA: 40,      // Market influence (40% total)
        SOCIAL_SENTIMENT: 30,  // Social sentiment (30%)
        ON_CHAIN: 30          // On-chain metrics (30%)
    };

    // Market component sub-weights (must total to MARKET_DATA)
    static MARKET_WEIGHTS = {
        VOLUME: 15,           // Volume component (15%)
        PRICE: 15,           // Price action (15%)
        MARKET_CAP: 10       // Market cap changes (10%)
    };

    constructor() {
        // Validate weights total to 100%
        const totalWeight = Object.values(this.constructor.WEIGHTS).reduce((a, b) => a + b, 0);
        if (totalWeight !== 100) {
            throw new Error(`Invalid weights configuration. Total: ${totalWeight}%, Expected: 100%`);
        }

        // Validate market weights total to MARKET_DATA
        const totalMarketWeight = Object.values(this.constructor.MARKET_WEIGHTS).reduce((a, b) => a + b, 0);
        if (totalMarketWeight !== this.constructor.WEIGHTS.MARKET_DATA) {
            throw new Error(`Invalid market weights. Total: ${totalMarketWeight}%, Expected: ${this.constructor.WEIGHTS.MARKET_DATA}%`);
        }
    }

    async calculateIndex(marketMetrics, socialMetrics = {}, onChainMetrics = {}) {
        // Calculate individual components
        const marketScore = this.calculateMarketScore(marketMetrics);
        const socialScore = this.calculateSocialScore(socialMetrics);
        const onChainScore = await this.calculateOnChainScore(onChainMetrics);  // Wait for async

        // Combine scores using weights
        const score = (
            marketScore * (this.constructor.WEIGHTS.MARKET_DATA / 100) +
            socialScore * (this.constructor.WEIGHTS.SOCIAL_SENTIMENT / 100) +
            onChainScore * (this.constructor.WEIGHTS.ON_CHAIN / 100)
        );

        return {
            score: Math.max(0, Math.min(100, score)),  // Clamp between 0-100
            label: this.getIndexLabel(score),
            components: {
                market: marketScore,
                social: socialScore,
                onChain: onChainScore  // Now resolved
            }
        };
    }

    calculateMarketScore(metrics) {
        // Convert percentages to scores (0-100 scale)
        const volumeScore = this.normalizePercentageToScore(metrics.volume_change_24h);
        const priceScore = this.normalizePercentageToScore(metrics.price_change_percentage_24h);
        const mcapScore = this.normalizePercentageToScore(metrics.market_cap_change_percentage_24h);

        console.log('Market Component Scores:', {
            volume: volumeScore,
            price: priceScore,
            mcap: mcapScore
        });

        // Apply weights within the market component (should total to 40)
        const volumeComponent = volumeScore * (this.constructor.MARKET_WEIGHTS.VOLUME / 40);    // 15/40
        const priceComponent = priceScore * (this.constructor.MARKET_WEIGHTS.PRICE / 40);       // 15/40
        const mcapComponent = mcapScore * (this.constructor.MARKET_WEIGHTS.MARKET_CAP / 40);    // 10/40

        // Calculate total market score (0-100)
        const marketScore = volumeComponent + priceComponent + mcapComponent;

        console.log('Market Components:', {
            volume: volumeComponent,
            price: priceComponent,
            mcap: mcapComponent,
            total: marketScore
        });

        return Math.max(0, Math.min(100, marketScore));
    }

    // Helper method to convert percentage changes to 0-100 scores
    normalizePercentageToScore(percentage) {
        // Define thresholds for scoring
        const VERY_BEARISH = -10;  // -10% or worse = 0
        const BEARISH = -5;        // -5% = 25
        const NEUTRAL = 0;         // 0% = 50
        const BULLISH = 5;         // +5% = 75
        const VERY_BULLISH = 10;   // +10% or better = 100

        // Convert percentage to score
        if (percentage <= VERY_BEARISH) return 0;
        if (percentage >= VERY_BULLISH) return 100;

        // Linear interpolation between thresholds
        if (percentage < BEARISH) {
            return (percentage - VERY_BEARISH) * (25 / (BEARISH - VERY_BEARISH));
        }
        if (percentage < NEUTRAL) {
            return 25 + (percentage - BEARISH) * (25 / (NEUTRAL - BEARISH));
        }
        if (percentage < BULLISH) {
            return 50 + (percentage - NEUTRAL) * (25 / (BULLISH - NEUTRAL));
        }
        return 75 + (percentage - BULLISH) * (25 / (VERY_BULLISH - BULLISH));
    }

    calculateSocialScore(metrics = {}) {
        // For now, just use the total or default to neutral
        return metrics.total || 50;
    }

    // Keep this sync since we're not using real on-chain data in update-index
    calculateOnChainScore(metrics = {}) {
        // Just use the total or default to neutral
        return metrics.total || 50;
    }

    normalizeTransactionCount(txCount) {
        // Normalize transaction count (0-100)
        const MIN_TX = 100;    // Below this is bearish
        const MAX_TX = 10000;  // Above this is very bullish

        if (txCount <= MIN_TX) return 20;
        if (txCount >= MAX_TX) return 100;

        // Linear interpolation between min and max
        return 20 + (txCount - MIN_TX) * (80 / (MAX_TX - MIN_TX));
    }

    getIndexLabel(score) {
        if (score >= 80) return 'VERY_BULLISH';
        if (score >= 60) return 'BULLISH';
        if (score >= 40) return 'NEUTRAL';
        if (score >= 20) return 'BEARISH';
        return 'VERY_BEARISH';
    }

    log(message) {
        console.log(`[OverBackCalculator] ${message}`);
    }

    setTestWeights(weights) {
        // Store original weights for reset
        this._originalWeights = { ...this.constructor.WEIGHTS };
        this._originalMarketWeights = { ...this.constructor.MARKET_WEIGHTS };

        // Validate new weights
        const totalWeight = weights.MARKET_DATA + weights.SOCIAL_SENTIMENT + weights.ON_CHAIN;
        if (totalWeight !== 100) {
            throw new Error(`Invalid test weights. Total: ${totalWeight}%, Expected: 100%`);
        }

        if (weights.MARKET_WEIGHTS) {
            const marketTotal = weights.MARKET_WEIGHTS.VOLUME + 
                              weights.MARKET_WEIGHTS.PRICE + 
                              weights.MARKET_WEIGHTS.MARKET_CAP;
            if (marketTotal !== weights.MARKET_DATA) {
                throw new Error(`Invalid market weights. Total: ${marketTotal}%, Expected: ${weights.MARKET_DATA}%`);
            }
            
            // Update market sub-weights
            this.constructor.MARKET_WEIGHTS = weights.MARKET_WEIGHTS;
        }

        // Update main weights
        this.constructor.WEIGHTS = {
            MARKET_DATA: weights.MARKET_DATA,
            SOCIAL_SENTIMENT: weights.SOCIAL_SENTIMENT,
            ON_CHAIN: weights.ON_CHAIN
        };

        this.log(`Test weights set:
            Market: ${weights.MARKET_DATA}%
            Sentiment: ${weights.SOCIAL_SENTIMENT}%
            On-Chain: ${weights.ON_CHAIN}%
        `);
    }

    resetWeights() {
        if (this._originalWeights) {
            this.constructor.WEIGHTS = this._originalWeights;
            this.constructor.MARKET_WEIGHTS = this._originalMarketWeights;
            this.log('Weights reset to original values');
        }
    }
}

module.exports = OverBackCalculator; 