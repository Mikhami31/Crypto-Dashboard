const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CMC_API_KEY = process.env.CMC_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));

// Utility: Fetch ATH for a list of coin IDs from CoinGecko
async function fetchATHsFromCoinGecko(coinIds) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data = await res.json();
    return Object.fromEntries(data.map(c => [c.symbol.toUpperCase(), c.ath || 0]));
  } catch (err) {
    console.error('CoinGecko ATH fetch error:', err);
    return {};
  }
}

// API: Combined crypto data with CoinMarketCap + CoinGecko ATH
app.get('/api/crypto-data', async (req, res) => {
  const limit = 50;
  const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=USD`;

  try {
    const cmcRes = await fetch(cmcUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!cmcRes.ok) {
      const text = await cmcRes.text();
      return res.status(cmcRes.status).send(`CMC Error: ${text}`);
    }

    const cmcData = (await cmcRes.json()).data;

    const symbols = cmcData.map(c => c.symbol.toLowerCase());
    const geckoMap = {
      btc: 'bitcoin',
      eth: 'ethereum',
      sol: 'solana',
      bnb: 'binancecoin',
      ada: 'cardano',
      xrp: 'ripple',
      doge: 'dogecoin',
      dot: 'polkadot',
      link: 'chainlink',
      matic: 'polygon',
      trx: 'tron',
      ltc: 'litecoin',
      avax: 'avalanche-2',
      xlm: 'stellar',
      uni: 'uniswap',
      near: 'near',
      etc: 'ethereum-classic',
      fil: 'filecoin',
      atom: 'cosmos',
      egld: 'multiversx',
      sui: 'sui',
      // Add more mappings as needed
    };

    const mappedSymbols = symbols
      .filter(s => geckoMap[s])
      .map(s => geckoMap[s]);

    const athData = await fetchATHsFromCoinGecko(mappedSymbols);

    const result = cmcData.map((coin, i) => {
      const ath = athData[coin.symbol.toUpperCase()] || 0;
      const price = coin.quote.USD.price;
      const drawdown = ath > 0 ? (((price - ath) / ath) * 100).toFixed(2) : null;

      return {
        rank: coin.cmc_rank,
        name: coin.name,
        symbol: coin.symbol,
        price: price,
        percent_change_24h: coin.quote.USD.percent_change_24h,
        ath: ath,
        drawdown,
        market_cap: coin.quote.USD.market_cap,
        volume_24h: coin.quote.USD.volume_24h,
        market_cap_change_24h: coin.quote.USD.percent_change_24h, // proxy
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('CMC API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Market summary from CMC only
app.get('/api/market-summary', async (req, res) => {
  const limit = 50;
  const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=USD`;

  try {
    const cmcRes = await fetch(cmcUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!cmcRes.ok) {
      const text = await cmcRes.text();
      return res.status(cmcRes.status).send(`CMC Error: ${text}`);
    }

    const data = (await cmcRes.json()).data;
    const sorted = [...data].sort((a, b) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h);

    const gainers = sorted.slice(0, 3).map(c => `${c.name} (${c.symbol}) +${c.quote.USD.percent_change_24h.toFixed(2)}%`);
    const losers = sorted.slice(-3).reverse().map(c => `${c.name} (${c.symbol}) ${c.quote.USD.percent_change_24h.toFixed(2)}%`);

    const up = data.filter(c => c.quote.USD.percent_change_24h > 0).length;
    const down = data.filter(c => c.quote.USD.percent_change_24h < 0).length;

    res.json({
      summary: `🧠 Market sentiment is ${up > down ? 'Positive 📈' : 'Negative 📉'}. ${up} up / ${down} down.`,
      top_gainers: gainers,
      top_losers: losers
    });
  } catch (err) {
    console.error('Market summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback to serve frontend
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'public/index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Frontend not found.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
