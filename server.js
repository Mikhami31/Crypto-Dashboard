const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API route to fetch crypto data from CoinGecko
app.get('/api/crypto-data', async (req, res) => {
  const vs_currency = req.query.vs_currency || 'usd';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=20&page=1&sparkline=false`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const transformed = data.map((coin, index) => {
      const price = coin.current_price || 0;
      const ath = coin.ath || 0;
      const drawdown = ath > 0 ? (((price - ath) / ath) * 100).toFixed(2) : 0;

      return {
        rank: index + 1,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price,
        percent_change_24h: coin.price_change_percentage_24h,
        ath,
        drawdown
      };
    });

    res.json(transformed);
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: 'Failed to fetch data from CoinGecko' });
  }
});

// Fallback for direct access (e.g. refresh)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
