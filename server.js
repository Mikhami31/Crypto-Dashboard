const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// CoinMarketCap: Crypto Market Data Endpoint
app.get('/api/crypto-data', async (req, res) => {
  const vs_currency = req.query.vs_currency || 'usd';
  const limit = parseInt(req.query.limit) || 50;

  try {
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=${vs_currency.toUpperCase()}`, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('CMC error:', error);
    res.status(500).json({ error: 'Failed to fetch data from CoinMarketCap' });
  }
});

// Santiment: Sentiment Score Endpoint
app.get('/api/sentiment', async (req, res) => {
  const symbols = req.query.symbols || 'BTC,ETH,SOL';
  const slugs = symbols.split(',').map(sym => `get_asset_id('${sym.toLowerCase()}')`).join(',\n');

  const query = `{
    runRawSqlQuery(
      sqlQueryText: """
        SELECT
          asset_id,
          argMax((positive_sentiment_score - negative_sentiment_score), computed_at) AS sentiment_balance
        FROM daily_metrics_v2
        WHERE
          asset_id IN (
            ${slugs}
          )
          AND dt >= now() - INTERVAL 1 DAY
        GROUP BY asset_id
        ORDER BY asset_id
      """,
      sqlQueryParameters: ""
    ) {
      columns
      rows
    }
  }`;

  try {
    const response = await fetch('https://api.santiment.net/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${process.env.SANTIMENT_API_KEY}`
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    res.json(data.data.runRawSqlQuery);
  } catch (error) {
    console.error('Santiment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
