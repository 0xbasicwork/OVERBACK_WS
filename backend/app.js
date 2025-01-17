const express = require('express');
const cors = require('cors');
const { formatDateUTC } = require('./utils/dateFormatter');
const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 