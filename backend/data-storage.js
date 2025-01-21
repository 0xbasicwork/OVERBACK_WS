const fs = require('fs/promises');
const path = require('path');

class DataStorage {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.historyFile = path.join(this.dataDir, 'over-back-history.json');
        this.indexFile = path.join(this.dataDir, 'index.json');
    }

    async initialize() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Create history file if it doesn't exist
            try {
                await fs.access(this.historyFile);
            } catch {
                await fs.writeFile(this.historyFile, JSON.stringify({ history: [] }));
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            throw error;
        }
    }

    async storeDaily(data) {
        try {
            const timestamp = new Date().toISOString();
            const entry = {
                timestamp,
                ...data
            };

            // Read existing history
            const content = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(content);

            // Add new entry
            history.history.push(entry);

            // Keep only last 365 days
            if (history.history.length > 365) {
                history.history = history.history.slice(-365);
            }

            // Save updated history
            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));

            // Store detailed daily data
            const dailyFile = path.join(this.dataDir, `${timestamp.split('T')[0]}.json`);
            await fs.writeFile(dailyFile, JSON.stringify(data, null, 2));

            return entry;
        } catch (error) {
            console.error('Failed to store daily data:', error);
            throw error;
        }
    }

    async getHistory(days = 30) {
        try {
            const content = await fs.readFile(this.indexFile, 'utf8');
            const data = JSON.parse(content);
            const history = data.history || [];
            return history.map(entry => {
                const score = this.roundNumber(entry.score);
                return {
                    score,
                    components: {
                        market: this.roundNumber(entry.components.market.total),
                        social: this.roundNumber(entry.components.social.total),
                        onChain: this.roundNumber(entry.components.onchain.total)
                    },
                    timestamp: entry.timestamp
                };
            });
        } catch (error) {
            console.error('Failed to read history:', error);
            throw error;
        }
    }

    getLabel(score) {
        if (score < 20) return "It's so over";
        if (score < 40) return "It is what it is";
        if (score < 60) return "We vibing";
        if (score < 80) return "We're so back";
        return "LET'S FUCKING GOOO!";
    }

    async getLatest() {
        try {
            const content = await fs.readFile(this.indexFile, 'utf8');
            const data = JSON.parse(content);
            
            // Handle case where data structure is incomplete
            const score = this.roundNumber(data.current || 50);
            const components = data.components || {
                market: { total: 50 },
                social: { total: 50 },
                onchain: { total: 50 }
            };
            
            const marketValue = this.roundNumber(components.market?.total || 50);
            const socialValue = this.roundNumber(components.social?.total || 50);
            const onChainValue = this.roundNumber(components.onchain?.total || 50);

            return {
                score,
                label: this.getLabel(score),
                components: {
                    market: marketValue,
                    social: socialValue,
                    onChain: onChainValue
                },
                timestamp: data.lastUpdated || new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get latest data:', error);
            // Return default values if file doesn't exist or is corrupted
            const defaultScore = 50;
            return {
                score: defaultScore,
                label: this.getLabel(defaultScore),
                components: {
                    market: 50,
                    social: 50,
                    onChain: 50
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    async getTrend() {
        try {
            const history = await this.getHistory(7); // Last 7 days
            if (history.length < 2) return 'insufficient_data';

            const latest = history[history.length - 1].score;
            const previous = history[0].score;
            const change = latest - previous;

            if (Math.abs(change) < 5) return 'stable';
            return change > 0 ? 'increasing' : 'decreasing';
        } catch (error) {
            console.error('Failed to calculate trend:', error);
            throw error;
        }
    }

    async storeIndexData(data) {
        try {
            const timestamp = new Date().toISOString();
            
            // Read existing data to preserve history
            let existingData = { history: [] };
            try {
                const content = await fs.readFile(this.indexFile, 'utf8');
                existingData = JSON.parse(content);
            } catch (error) {
                console.log('No existing index file found, creating new one');
            }

            // Add current data to history
            if (existingData.current) {
                existingData.history.push({
                    score: existingData.current,
                    components: existingData.components,
                    timestamp: existingData.lastUpdated
                });
            }

            // Keep only last 365 entries
            if (existingData.history.length > 365) {
                existingData.history = existingData.history.slice(-365);
            }

            const indexData = {
                current: data.score,
                components: data.components,
                lastUpdated: timestamp,
                history: existingData.history
            };

            await fs.writeFile(this.indexFile, JSON.stringify(indexData, null, 2));
            console.log('Index data stored successfully');
        } catch (error) {
            console.error('Failed to store index data:', error);
            throw error;
        }
    }

    roundNumber(number) {
        return Math.round(number * 100) / 100;
    }
}

module.exports = DataStorage; 