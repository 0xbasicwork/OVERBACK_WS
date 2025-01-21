const express = require('express');
const cors = require('cors');
const { formatDateUTC } = require('./utils/dateFormatter');
const DataStorage = require('./data-storage');

const app = express();
const storage = new DataStorage();

app.use(cors());
app.use(express.json());

// Initialize storage
storage.initialize().catch(error => {
  console.error('Failed to initialize storage:', error);
  process.exit(1);
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Add more endpoints like:
app.get('/api/data', (req, res) => {
  const now = new Date();
  res.json({ 
    price: '1.23',
    marketCap: '1000000',
    lastUpdated: formatDateUTC(now),
    // ... other data
  });
});

app.get('/api/index/latest', async (req, res) => {
  try {
    const latestData = await storage.getLatest();
    if (!latestData) {
      return res.json({
        score: 0,
        components: {
          market: 0,
          social: 0,
          onChain: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json(latestData);
  } catch (error) {
    console.error('Failed to fetch latest score:', error);
    res.status(500).json({ 
      error: 'Failed to fetch latest score',
      details: error.message 
    });
  }
});

function formatResponse(data) {
  // Create response object with exact structure needed
  const response = {
    score: roundNumber(data.score),
    components: {
      market: roundNumber(data.components.market),
      social: roundNumber(data.components.social),
      onChain: roundNumber(data.components.onChain)
    },
    timestamp: data.timestamp
  };

  // Convert to string and back to ensure no floating point numbers
  const stringified = JSON.stringify(response);
  return JSON.parse(stringified);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 