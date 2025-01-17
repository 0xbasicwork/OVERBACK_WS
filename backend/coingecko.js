const axios = require('axios');
const { CORE_TOKENS } = require('./token-config');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const MarketDatabase = require('./database');

class RateLimit {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
    }

    async waitIfNeeded() {
        const now = Date.now();
        this.requests = this.requests.filter(time => time > now - this.timeWindow);
        
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = oldestRequest + this.timeWindow - now;
            if (waitTime > 0) {
                console.log(`Rate limit reached, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        this.requests.push(now);
    }
}

class CreditTracker {
    constructor(monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
        this.monthlyUsage = 0;
        this.lastResetDate = new Date();
    }

    checkAndResetMonthly() {
        const now = new Date();
        if (now.getMonth() !== this.lastResetDate.getMonth()) {
            console.log('Resetting monthly credit usage counter');
            this.monthlyUsage = 0;
            this.lastResetDate = now;
        }
    }

    async trackRequest(credits = 1) {
        this.checkAndResetMonthly();
        
        if (this.monthlyUsage + credits > this.monthlyLimit) {
            throw new Error('Monthly credit limit exceeded');
        }
        
        this.monthlyUsage += credits;
        console.log(`Credit Usage: ${this.monthlyUsage}/${this.monthlyLimit}`);
    }
}

class CoinGecko {
    constructor() {
        this.debug = process.env.DEBUG_MODE === 'true';
        this.apiKey = process.env.COINGECKO_API_KEY;
        this.baseUrl = 'https://pro-api.coingecko.com/api/v3';
        this.validTokenIds = this.getValidTokenIds();
        this.rateLimit = new RateLimit(500, 60000);
        this.creditTracker = new CreditTracker(500000);
        this.dataDir = path.join(__dirname, 'data');
        this.rankingsFile = path.join(this.dataDir, 'rankings.json');
        this.historicalFile = path.join(this.dataDir, 'historical.json');
    }

    debugLog(message, data) {
        if (this.debug) {
            console.log(message, data ? JSON.stringify(data, null, 2) : '');
        }
    }

    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            this.previousRankings = await this.loadRankings();
            this.historicalData = await this.loadHistoricalData();
        } catch (error) {
            console.error('Failed to initialize data storage:', error);
            this.previousRankings = new Map();
            this.historicalData = { listings: [], marketCaps: {} };
        }
    }

    async loadRankings() {
        try {
            const data = await fs.readFile(this.rankingsFile, 'utf8');
            const rankings = JSON.parse(data);
            return new Map(Object.entries(rankings));
        } catch (error) {
            return new Map();
        }
    }

    async saveRankings(rankings) {
        const rankingsObj = Object.fromEntries(rankings);
        await fs.writeFile(this.rankingsFile, JSON.stringify(rankingsObj, null, 2));
    }

    async loadHistoricalData() {
        try {
            const data = await fs.readFile(this.historicalFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { listings: [], marketCaps: {} };
        }
    }

    async saveHistoricalData() {
        await fs.writeFile(this.historicalFile, JSON.stringify(this.historicalData, null, 2));
    }

    getValidTokenIds() {
        const coreIds = Object.values(CORE_TOKENS || {})
            .map(token => token?.coingeckoId)
            .filter(id => id !== null && id !== undefined);
        
        if (coreIds.length === 0) {
            console.warn('No token IDs configured, using default SOL');
            return ['solana'];
        }
        return coreIds;
    }

    async getMarketData() {
        try {
            await this.initialize();
            await this.rateLimit.waitIfNeeded();
            await this.creditTracker.trackRequest(10);

            const response = await axios.get(`${this.baseUrl}/coins/markets`, {
                params: {
                    vs_currency: 'usd',
                    ids: this.validTokenIds.join(','),  // Use configured token IDs
                    order: 'market_cap_desc',
                    per_page: 20,
                    page: 1,
                    sparkline: false,
                    price_change_percentage: '24h',
                    include_market_cap: true,
                    include_24hr_vol: true,
                    include_24hr_change: true,
                    include_24h_vol: true,
                    x_cg_pro_api_key: this.apiKey
                },
                headers: { 'x-cg-pro-api-key': this.apiKey }
            });

            const marketData = response.data[0] || {};
            
            try {
                // Store volume data (but don't fail if storage fails)
                const db = new MarketDatabase();
                await db.storeVolumeData(
                    marketData.id,
                    marketData.total_volume,
                    new Date().toISOString()
                );

                // Get 24h ago volume
                const volume24hAgo = db.getVolume24hAgo(marketData.id) || marketData.total_volume;
                const volumeChange = ((marketData.total_volume - volume24hAgo) / volume24hAgo) * 100;
                
                return {
                    price_change_percentage_24h: marketData.price_change_percentage_24h || 0,
                    volume_change_24h: volumeChange,
                    market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h || 0,
                    total_volume: marketData.total_volume || 0,
                    market_cap: marketData.market_cap || 0,
                    current_price: marketData.current_price || 0
                };
            } catch (dbError) {
                console.warn('Failed to store/retrieve volume data:', dbError);
                // Return data without volume change if DB fails
                return {
                    price_change_percentage_24h: marketData.price_change_percentage_24h || 0,
                    volume_change_24h: 0,
                    market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h || 0,
                    total_volume: marketData.total_volume || 0,
                    market_cap: marketData.market_cap || 0,
                    current_price: marketData.current_price || 0
                };
            }
        } catch (error) {
            console.error('Failed to fetch CoinGecko data:', error);
            if (error.response) {
                console.error('API Response:', error.response.data);
                console.error('Status:', error.response.status);
            }
            // Return default values instead of null
            return {
                price_change_percentage_24h: 0,
                volume_change_24h: 0,
                market_cap_change_percentage_24h: 0,
                total_volume: 0,
                market_cap: 0,
                current_price: 0
            };
        }
    }

    async fetchMarketData() {
        console.log('Fetching market data...');
        const response = await axios.get(`${this.baseUrl}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                ids: this.validTokenIds.join(','),
                order: 'market_cap_desc',
                per_page: 20,
                page: 1,
                sparkline: true,
                price_change_percentage: '24h,7d',
                include_market_cap: true,
                include_24hr_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
                x_cg_pro_api_key: this.apiKey
            },
            headers: { 'x-cg-pro-api-key': this.apiKey }
        });
        
        return response.data || [];
    }

    async fetchTopVolumeCoins() {
        const response = await axios.get(`${this.baseUrl}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'volume_desc',
                per_page: 100,
                sparkline: false,
                x_cg_pro_api_key: this.apiKey
            },
            headers: { 'x-cg-pro-api-key': this.apiKey }
        });
        return response.data || [];
    }

    async fetchNewListings() {
        const response = await axios.get(`${this.baseUrl}/coins/list`, {
            params: {
                include_platform: false,
                x_cg_pro_api_key: this.apiKey
            },
            headers: { 'x-cg-pro-api-key': this.apiKey }
        });
        return response.data || [];
    }

    async fetchTrendingCoins() {
        const response = await axios.get(`${this.baseUrl}/search/trending`, {
            headers: { 'x-cg-pro-api-key': this.apiKey }
        });
        return response.data?.coins || [];
    }

    processMarketData(tokens) {
        const now = Date.now();
        const solMetrics = this.calculateSolanaMetrics(tokens);

        const baseMetrics = {
            volume_metrics: this.calculateVolumeMetrics(tokens),
            price_metrics: this.calculatePriceMetrics(tokens),
            market_cap_metrics: this.calculateMarketCapMetrics(tokens),
            timestamp: now
        };

        // Adjust all metrics based on SOL's performance
        return {
            ...baseMetrics,
            volume_metrics: this.adjustScoresBySolana(baseMetrics.volume_metrics, solMetrics),
            price_metrics: this.adjustScoresBySolana(baseMetrics.price_metrics, solMetrics),
            market_cap_metrics: this.adjustScoresBySolana(baseMetrics.market_cap_metrics, solMetrics),
            sol_metrics: solMetrics  // Include SOL metrics in output
        };
    }

    calculateVolumeMetrics(tokens) {
        const solToken = tokens.find(t => t.id === 'solana');
        const solMetrics = solToken ? {
            price_change: solToken.price_change_percentage_24h,
            volume_change: solToken.total_volume / solToken.market_cap
        } : null;

        const totalVolume = tokens.reduce((sum, t) => sum + t.total_volume, 0);
        const averageVolume = totalVolume / tokens.length;
        const volumeToMarketCapRatio = tokens.reduce((sum, t) => 
            sum + (t.total_volume / t.market_cap), 0) / tokens.length;

        // Make volume normalization more generous
        let normalizedScore = Math.min(1, Math.max(0, 
            (volumeToMarketCapRatio - 0.10) / 0.25  // Score of 1.0 at 0.35 ratio instead of 0.50
        ));

        // Adjust score based on SOL performance
        if (solMetrics && solMetrics.price_change > 0) {
            // If SOL is up, we're more generous with scores
            normalizedScore = Math.min(1, normalizedScore * 1.2);
        }

        return {
            total_volume: totalVolume,
            average_volume: averageVolume,
            volume_to_market_cap_ratio: volumeToMarketCapRatio,
            normalized_score: normalizedScore,
            spreads: this.calculateSpreads(tokens),
            sol_metrics: solMetrics  // Include SOL metrics in output
        };
    }

    calculateSpread(token) {
        if (!token.high_24h || !token.low_24h) return null;
        return ((token.high_24h - token.low_24h) / token.current_price) * 100;
    }

    analyzeVolumeContext(tokens, topVolume) {
        const volumeRanks = new Map(topVolume.map((t, i) => [t.id, i + 1]));
        const tokenVolumes = tokens.map(t => ({
            token: t.id,
            volume: t.total_volume,
            rank: volumeRanks.get(t.id) || null
        }));

        return {
            volume_rankings: tokenVolumes.reduce((acc, t) => ({ ...acc, [t.token]: t.rank }), {}),
            top_100_count: tokenVolumes.filter(t => t.rank && t.rank <= 100).length,
            normalized_score: this.normalizeMetric(tokenVolumes.map(t => t.rank ? (101 - t.rank) : 0))
        };
    }

    calculateListingImpact(newListings) {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        
        // Update historical listings
        this.historicalData.listings = [
            ...this.historicalData.listings,
            ...newListings.filter(t => !this.historicalData.listings.includes(t.id)).map(t => ({
                id: t.id,
                timestamp: now
            }))
        ].filter(t => t.timestamp >= oneDayAgo);

        const recentListings = this.historicalData.listings.filter(t => t.timestamp >= oneDayAgo);
        return recentListings.length / Math.max(newListings.length, 1);
    }

    calculatePriceMetrics(tokens) {
        const priceChanges = tokens.map(t => Math.abs(t.price_change_percentage_24h));
        const avgPriceChange = priceChanges.reduce((sum, p) => sum + p, 0) / tokens.length;
        
        // More generous price normalization
        const normalizedScore = Math.min(1, Math.max(0,
            (avgPriceChange - 1) / 14  // Score of 1.0 at 15% change instead of 20%
        ));

        return {
            average_price_change_24h: avgPriceChange,
            average_price_change_7d: 0,
            average_volatility: this.calculateVolatility(tokens),
            normalized_score: normalizedScore
        };
    }

    calculateMarketCapMetrics(tokens) {
        const solToken = tokens.find(t => t.id === 'solana');
        const isSolBullish = solToken && solToken.price_change_percentage_24h > 0;

        // Adjust thresholds based on SOL's performance
        const thresholds = isSolBullish ? {
            volume: { min: 0.08, range: 0.22 },    // More generous when SOL is up
            price: { min: 0.8, range: 12 },
            marketCap: { min: 0.4, range: 8.5 }
        } : {
            volume: { min: 0.10, range: 0.25 },    // Normal thresholds
            price: { min: 1, range: 14 },
            marketCap: { min: 0.5, range: 9.5 }
        };

        const totalMarketCap = tokens.reduce((sum, t) => sum + t.market_cap, 0);
        const marketCapChanges = tokens.map(t => Math.abs(t.market_cap_change_percentage_24h));
        const avgMarketCapChange = marketCapChanges.reduce((sum, m) => sum + m, 0) / tokens.length;

        // More generous market cap normalization
        const normalizedScore = Math.min(1, Math.max(0,
            (avgMarketCapChange - thresholds.marketCap.min) / thresholds.marketCap.range
        ));

        return {
            total_market_cap: totalMarketCap,
            average_market_cap_change: avgMarketCapChange,
            rank_changes: this.calculateRankChanges(tokens),
            normalized_score: normalizedScore
        };
    }

    calculateLiquidityMetrics(tokens) {
        const liquidityMetrics = tokens.map(t => ({
            token: t.id,
            liquidity_score: t.liquidity_score || 0,
            bid_ask_spread: t.bid_ask_spread_percentage || 0
        }));

        return {
            average_liquidity_score: liquidityMetrics.reduce((sum, t) => sum + t.liquidity_score, 0) / liquidityMetrics.length,
            average_spread: liquidityMetrics.reduce((sum, t) => sum + t.bid_ask_spread, 0) / liquidityMetrics.length,
            normalized_score: this.normalizeMetric(liquidityMetrics.map(t => t.liquidity_score))
        };
    }

    calculateRankChange(tokenId, currentRank) {
        const previousRank = this.previousRankings.get(tokenId) || currentRank;
        this.previousRankings.set(tokenId, currentRank);
        return previousRank - currentRank; // Positive means improvement in rank
    }

    calculateVolatility(prices) {
        if (!prices || prices.length < 2) return 0;
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        return this.standardDeviation(returns);
    }

    calculateTrendingImpact(availableTokens, trendingCoins) {
        const trendingIds = new Set(trendingCoins.map(c => c.item.id));
        const trendingCount = availableTokens.filter(t => trendingIds.has(t.id)).length;
        return trendingCount / availableTokens.length;
    }

    normalizeMetric(values) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        return max === min ? 1 : (values.reduce((sum, val) => sum + (val - min) / (max - min), 0) / values.length);
    }

    standardDeviation(values) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squareDiffs = values.map(val => Math.pow(val - avg, 2));
        return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length);
    }

    calculateWeightedComponents(processedData, volumeContext) {
        // Calculate base scores without bonuses
        const volumeScore = processedData.volume_metrics.normalized_score;
        const priceScore = processedData.price_metrics.normalized_score;
        const marketCapScore = processedData.market_cap_metrics.normalized_score;
        const spreadScore = this.calculateSpreadScore(processedData.volume_metrics.spreads);

        // Calculate total market score (40% total)
        return {
            market_score: (volumeScore * 0.15 + priceScore * 0.15 + marketCapScore * 0.10),
            // Individual components for reference (not added to total)
            price_score: priceScore * 0.15,         // 15% max
            market_cap_score: marketCapScore * 0.10, // 10% max
            spread_score: spreadScore * 0.15         // 15% max
        };
    }

    calculateSpreadScore(spreads) {
        const validSpreads = Object.values(spreads).filter(s => s !== null);
        if (validSpreads.length === 0) return 0;
        
        // Lower spreads are better, so we invert the normalization
        const normalized = this.normalizeMetric(validSpreads.map(s => 1 / (s + 1)));
        return normalized;
    }

    async updateHistoricalData(currentData) {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Update market caps
        currentData.forEach(token => {
            if (!this.historicalData.marketCaps[token.id]) {
                this.historicalData.marketCaps[token.id] = [];
            }

            this.historicalData.marketCaps[token.id].push({
                timestamp: now,
                market_cap: token.market_cap
            });
        });

        // Clean up old data
        Object.keys(this.historicalData.marketCaps).forEach(tokenId => {
            this.historicalData.marketCaps[tokenId] = this.historicalData.marketCaps[tokenId]
                .filter(entry => entry.timestamp >= oneDayAgo);
        });

        await this.saveHistoricalData();
    }

    getDefaultMetrics() {
        return {
            volume_metrics: { normalized_score: 0, spreads: {} },
            price_metrics: { normalized_score: 0 },
            market_cap_metrics: { normalized_score: 0 },
            volume_context: { normalized_score: 0, volume_rankings: {} },
            listing_impact: 0,
            trending_impact: 0,
            available_tokens: [],
            token_count: 0,
            weighted_components: {
                market_score: 0,
                price_score: 0,
                market_cap_score: 0,
                spread_score: 0
            }
        };
    }

    // New helper methods for bonuses
    calculateRankingBonus(volumeContext) {
        // Bonus for having tokens in top rankings
        const topTokens = Object.values(volumeContext.volume_rankings)
            .filter(rank => rank && rank <= 50).length;
        return topTokens * 0.05;  // 5% bonus per top 50 token
    }

    calculateTrendBonus(priceMetrics) {
        // Bonus for consistent positive trends
        return priceMetrics.average_price_change_24h > 5 ? 1.1 : 1;
    }

    calculateStabilityBonus(marketCapMetrics) {
        // Bonus for stable growth
        return marketCapMetrics.average_market_cap_change > 5 ? 1.1 : 1;
    }

    calculateLiquidityBonus(processedData) {
        // Bonus for good liquidity
        const avgSpread = Object.values(processedData.volume_metrics.spreads)
            .reduce((sum, spread) => sum + spread, 0) / 
            Object.keys(processedData.volume_metrics.spreads).length;
        return avgSpread < 10 ? 1.1 : 1;
    }

    calculateSpreads(tokens) {
        const spreads = {};
        tokens.forEach(token => {
            if (token.high_24h && token.low_24h && token.current_price) {
                spreads[token.id] = ((token.high_24h - token.low_24h) / token.current_price) * 100;
            }
        });
        return spreads;
    }

    calculateRankChanges(tokens) {
        const rankChanges = {};
        tokens.forEach(token => {
            if (token.market_cap_rank) {
                const change = this.calculateRankChange(token.id, token.market_cap_rank);
                rankChanges[token.id] = change;
            }
        });
        return rankChanges;
    }

    calculateSolanaMetrics(tokens) {
        const solToken = tokens.find(t => t.id === 'solana');
        if (!solToken) return null;

        return {
            price: solToken.current_price,
            price_change_24h: solToken.price_change_percentage_24h,
            volume: solToken.total_volume,
            market_cap: solToken.market_cap,
            volume_to_market_cap: solToken.total_volume / solToken.market_cap,
            rank: solToken.market_cap_rank,
            sentiment: solToken.price_change_percentage_24h > 0 ? 'bullish' : 'bearish'
        };
    }

    adjustScoresBySolana(metrics, solMetrics) {
        if (!solMetrics) return metrics;

        const solMultiplier = solMetrics.price_change_24h > 0 
            ? 1 + (Math.min(solMetrics.price_change_24h, 20) / 100)  // Up to 20% bonus when SOL is up
            : 1 - (Math.min(Math.abs(solMetrics.price_change_24h), 10) / 200); // Max 5% reduction when SOL is down

        return {
            ...metrics,
            normalized_score: Math.min(1, metrics.normalized_score * solMultiplier)
        };
    }
}

module.exports = CoinGecko;