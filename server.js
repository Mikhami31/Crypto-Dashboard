const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/api/crypto-data', async (req, res) => {
  const currency = req.query.vs_currency || 'usd';
  const cachePath = `./cache-${currency}.json`;
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=20&page=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Transform response
    const transformed = data.map((coin, i) => ({
      rank: i + 1,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      percent_change_24h: coin.price_change_percentage_24h,
      ath: coin.ath,
      drawdown: ((coin.current_price - coin.ath) / coin.ath * 100).toFixed(2),
    }));

    // Save to cache
    fs.writeFileSync(cachePath, JSON.stringify(transformed), 'utf-8');

    res.json(transformed);
  } catch (err) {
    console.error('⚠️ Error fetching CoinGecko API:', err.message);

    // Try to return cached data
    if (fs.existsSync(cachePath)) {
      const cached = fs.readFileSync(cachePath, 'utf-8');
      return res.json(JSON.parse(cached));
    }

    res.status(500).json({ error: 'Failed to fetch data and no cache available' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
