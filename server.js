const express = require('express'); const fetch = require('node-fetch'); const path = require('path'); const app = express(); const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/crypto-data', async (req, res) => { const vs_currency = req.query.vs_currency || 'usd'; const limit = parseInt(req.query.limit) || 50; const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;

try { const response = await fetch(url); const data = await response.json();

const processed = data.map((coin, index) => {
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
    drawdown,
    market_cap: coin.market_cap,
    volume_24h: coin.total_volume,
    market_cap_change_24h: coin.market_cap_change_percentage_24h,
    circulating_supply: coin.circulating_supply,
    total_supply: coin.total_supply,
  };
});

res.json(processed);

} catch (err) { console.error("API Error:", err); res.status(500).json({ error: 'Failed to fetch data from CoinGecko' }); } });

app.get('/api/market-summary', async (req, res) => { const vs_currency = req.query.vs_currency || 'usd'; const url = https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false;

try { const response = await fetch(url); const data = await response.json();

const sorted = data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
const gainers = sorted.slice(0, 3).map(c => `${c.name} (${c.symbol.toUpperCase()}) +${c.price_change_percentage_24h.toFixed(2)}%`);
const losers = sorted.slice(-3).reverse().map(c => `${c.name} (${c.symbol.toUpperCase()}) ${c.price_change_percentage_24h.toFixed(2)}%`);

const up = data.filter(c => c.price_change_percentage_24h > 0).length;
const down = data.filter(c => c.price_change_percentage_24h < 0).length;
const total = data.length;
const sentiment = up > down ? 'Positive' : 'Negative';

res.json({
  summary: `📈 Market sentiment is ${sentiment}. ${up} up / ${down} down out of ${total} coins.`,
  top_gainers: gainers,
  top_losers: losers
});

} catch (err) { console.error("Summary API Error:", err); res.status(500).json({ error: 'Failed to generate market summary' }); } });

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public/index.html')); });

app.listen(PORT, () => { console.log(✅ Server running on http://localhost:${PORT}); });


