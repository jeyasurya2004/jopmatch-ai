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
const algoliaApiKey = process.env.ALGOLIA_API_KEY;
const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || 'jopmatch-ai'; // Default index name

let algoliaClient;
// Removed algoliaIndex, as search is called directly on algoliaClient

console.log('Before Algolia initialization block.');
console.log('algoliaAppId:', algoliaAppId);
console.log('algoliaApiKey:', algoliaApiKey ? '*****' : 'Not set'); // Mask API key
console.log('algoliaIndexName:', algoliaIndexName);

if (algoliaAppId && algoliaApiKey) {
  try {
    console.log('Attempting to initialize Algolia client...');
    algoliaClient = searchClient(algoliaAppId, algoliaApiKey);
    console.log(`Algolia initialized for app ID: ${algoliaAppId}`);
  } catch (error) {
    console.error('Error initializing Algolia client:', error);
  }
} else {
  console.warn('Algolia API keys are not defined in backend environment variables. Algolia search will be unavailable.');
}

// Use CORS middleware to allow requests from your frontend's origin
// For development, use the exact URL of your frontend.
// In production, tighten this to your actual deployed frontend URL.
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

  // Check for algoliaClient availability (algoliaIndex is no longer needed here)
  if (!algoliaClient) {
    return res.status(503).json({ error: 'Algolia search is not configured on the backend.' });
  }

  try {
    console.log(`Proxying search request to Algolia for query: "${query}" on index "${algoliaIndexName}"`);

    // Perform search directly on algoliaClient, specifying the index
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query,
          hitsPerPage: 10,
        },
      ],
    });

    // Algolia search returns results for each request, so we take the first one.
    const hits = results[0].hits;

    // Filter and format Algolia results to match the desired output structure
    const filteredResults = hits
      .filter(hit => hit.title && hit.url && hit.snippet) // Ensure required fields exist
      .map(hit => ({
        title: hit.title,
        url: hit.url,
        snippet: hit._snippetResult && hit._snippetResult.content ? hit._snippetResult.content.value : hit.content, // Adjust snippet extraction if necessary
      }));

    res.json({ results: filteredResults });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error proxying search for "${query}": ${error.message}`);
      if (error.response) {
        console.error('Algolia API responded with status:', error.response.status);
        console.error('Algolia API response data:', error.response.data);
        res.status(error.response.status).json({
          error: 'Error from Algolia API',
          details: error.response.data,
          status: error.response.status,
        });
      } else if (error.request) {
        console.error('No response received from Algolia API.');
        res.status(504).json({ error: 'Gateway Timeout: No response from Algolia API.' });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred in the proxy server.' });
      }
    } else {
      console.error('Unexpected error in proxy:', error);
      res.status(500).json({ error: 'An unexpected error occurred in the proxy server.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy listening on port ${PORT}`);
  console.log(`Frontend should target http://localhost:${PORT}/search-proxy for search queries.`);
});
