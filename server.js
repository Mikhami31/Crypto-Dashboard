// server.js const express = require('express'); const fetch = require('node-fetch'); const dotenv = require('dotenv'); dotenv.config();

const app = express(); const PORT = process.env.PORT || 3000; const LUNAR_API_KEY = process.env.LUNAR_API_KEY;

app.use(express.static('public'));

app.get('/api/crypto-data', async (req, res) => { const vs_currency = req.query.vs_currency || 'usd'; const limit = parseInt(req.query.limit) || 50; const url = https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=${vs_currency.toUpperCase()};

try { const result = await fetch(url, { headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY } }); const json = await result.json(); const data = json.data.map((c, i) => ({ rank: c.cmc_rank, name: c.name, symbol: c.symbol, price: c.quote[vs_currency.toUpperCase()].price, percent_change_24h: c.quote[vs_currency.toUpperCase()].percent_change_24h, market_cap: c.quote[vs_currency.toUpperCase()].market_cap, volume_24h: c.quote[vs_currency.toUpperCase()].volume_24h })); res.json(data); } catch (err) { console.error('CMC fetch error:', err); res.status(500).json({ error: 'CMC fetch failed' }); } });

app.get('/api/lunar-sentiment', async (req, res) => { const symbols = req.query.symbols; if (!symbols) return res.status(400).json({ error: 'Missing symbols' }); try { const url = https://api.lunarcrush.com/v2?data=market,social&key=${LUNAR_API_KEY}&symbol=${symbols}; const result = await fetch(url); const json = await result.json(); const sentimentMap = Object.fromEntries(json.data.map(c => [c.symbol.toUpperCase(), { galaxy_score: c.galaxy_score, average_sentiment: c.average_sentiment }])); res.json(sentimentMap); } catch (err) { console.error('LunarCrush error:', err); res.status(500).json({ error: 'LunarCrush fetch failed' }); } });

app.listen(PORT, () => console.log(✅ Server running on port ${PORT}));


