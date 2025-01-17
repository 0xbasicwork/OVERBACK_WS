const axios = require('axios');
const { CORE_TOKENS } = require('./token-config');
require('dotenv').config();

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

class ComputeUnitsTracker {
    constructor(monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
        this.monthlyUsage = 0;
        this.lastResetDate = new Date();
    }

    checkAndResetMonthly() {
        const now = new Date();
        if (now.getMonth() !== this.lastResetDate.getMonth()) {
            console.log('Resetting monthly CU usage counter');
            this.monthlyUsage = 0;
            this.lastResetDate = now;
        }
    }

    async trackRequest(computeUnits = 1) {
        this.checkAndResetMonthly();
        
        if (this.monthlyUsage + computeUnits > this.monthlyLimit) {
            throw new Error('Monthly compute units limit exceeded');
        }
        
        this.monthlyUsage += computeUnits;
        console.log(`CU Usage: ${this.monthlyUsage}/${this.monthlyLimit}`);
    }
}

class Birdeye {
    constructor() {
        this.apiKey = process.env.BIRDEYE_API_KEY;
        this.baseUrl = 'https://public-api.birdeye.so';
        // 60 requests per minute rate limit
        this.rateLimit = new RateLimit(60, 60000);
        // 30k compute units per month
        this.cuTracker = new ComputeUnitsTracker(30000);
    }

    async getTokenMetrics(tokenAddress) {
        await this.rateLimit.waitIfNeeded();
        await this.cuTracker.trackRequest(1); // 1 CU per request
        
        try {
            const response = await axios.get(`${this.baseUrl}/public/token_metadata`, {
                params: {
                    address: tokenAddress
                },
                headers: {
                    'X-API-KEY': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch Birdeye metadata for ${tokenAddress}:`, error.message);
            return null;
        }
    }

    async getTokenPrice(tokenAddress) {
        await this.rateLimit.waitIfNeeded();
        await this.cuTracker.trackRequest(1);
        
        try {
            const response = await axios.get(`${this.baseUrl}/public/price`, {
                params: {
                    address: tokenAddress
                },
                headers: {
                    'X-API-KEY': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch Birdeye price for ${tokenAddress}:`, error.message);
            return null;
        }
    }

    async getDEXPools(tokenAddress) {
        await this.rateLimit.waitIfNeeded();
        await this.cuTracker.trackRequest(2); // Pools endpoint might cost more CUs
        
        try {
            const response = await axios.get(`${this.baseUrl}/public/pools`, {
                params: {
                    token_address: tokenAddress
                },
                headers: {
                    'X-API-KEY': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch Birdeye pools for ${tokenAddress}:`, error.message);
            return null;
        }
    }

    async getAllTokenMetrics() {
        const metrics = {};
        
        for (const [name, token] of Object.entries(CORE_TOKENS)) {
            console.log(`Fetching Birdeye metrics for ${name}...`);
            
            const [metadata, price, pools] = await Promise.all([
                this.getTokenMetrics(token.contract),
                this.getTokenPrice(token.contract),
                this.getDEXPools(token.contract)
            ]);

            metrics[name] = {
                metadata,
                price,
                pools,
                aggregated: {
                    total_liquidity: pools?.data?.reduce((sum, pool) => sum + (pool.liquidity || 0), 0) || 0,
                    volume_24h: pools?.data?.reduce((sum, pool) => sum + (pool.volume24h || 0), 0) || 0,
                    price_change_24h: price?.data?.priceChange24h || 0,
                    holders: metadata?.data?.holder || 0
                }
            };
        }

        return {
            token_metrics: metrics,
            market_metrics: this.calculateMarketMetrics(metrics)
        };
    }

    calculateMarketMetrics(metrics) {
        const values = Object.values(metrics);
        
        return {
            total_liquidity: values.reduce((sum, token) => sum + token.aggregated.total_liquidity, 0),
            total_volume_24h: values.reduce((sum, token) => sum + token.aggregated.volume_24h, 0),
            average_price_change: values.reduce((sum, token) => sum + token.aggregated.price_change_24h, 0) / values.length,
            total_holders: values.reduce((sum, token) => sum + token.aggregated.holders, 0)
        };
    }
}

module.exports = Birdeye; 