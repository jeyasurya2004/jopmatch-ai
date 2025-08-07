const express = require('express');
const axios = require('axios');
const cors = require('cors'); // To handle CORS requests from your frontend
const dotenv = require('dotenv'); // To load environment variables from .env file
const { searchClient } = require('@algolia/client-search'); // Import searchClient from the new package

// Load environment variables from backend/.env
dotenv.config({ path: './backend/.env' });

const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable or default to 3001

// Initialize Algolia client
const algoliaAppId = process.env.ALGOLIA_APP_ID;
const algoliaApiKey = process.env.ALGOLIA_API_KEY; // Using the search-only key for the server
const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || 'jopmatch-ai';

let client;

if (algoliaAppId && algoliaApiKey) {
  try {
    client = searchClient(algoliaAppId, algoliaApiKey);
    console.log(`Algolia initialized for app ID: ${algoliaAppId}, and ready to search on index: ${algoliaIndexName}`);
  } catch (error) {
    console.error('Error initializing Algolia client:', error);
  }
} else {
  console.warn('Algolia API keys are not defined in backend environment variables. Algolia search will be unavailable.');
}

// Use CORS middleware to allow requests from your frontend's origin
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Default for local dev
console.log(`CORS allowing requests from: ${frontendUrl}`);
app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Proxy endpoint for search
app.get('/search-proxy', async (req, res) => {
  const query = req.query.q; // Get the search query from frontend

  if (!query) {
    return res.status(400).json({ error: 'Search query (q) is required.' });
  }

  if (!client) {
    return res.status(503).json({ error: 'Algolia search is not configured on the backend.' });
  }

  try {
    console.log(`Proxying search request to Algolia for query: "${query}" on index "${algoliaIndexName}"`);
    
    const { results } = await client.search({
        requests: [{
            indexName: algoliaIndexName,
            query: query
        }]
    });
    
    const searchResults = results[0].hits.map(hit => ({
      title: hit.title,
      url: hit.url,
      snippet: hit._snippetResult ? hit._snippetResult.content.value : (hit.snippet || ''), 
    }));
    
    res.json({ results: searchResults });

  } catch (error) {
    console.error('Error during Algolia search:', error);
    res.status(500).json({ error: 'An unexpected error occurred in the proxy server.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy listening on port ${PORT}`);
  console.log(`Frontend should target http://localhost:${PORT}/search-proxy for search queries.`);
});
