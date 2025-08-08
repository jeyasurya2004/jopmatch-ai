const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const algoliasearch = require('algoliasearch');

// Load environment variables at the very beginning
dotenv.config({ path: './backend/.env' });

const { scrapeAndIndexJobs } = require('./job_scraper');
const { scrapeAndIndexLearningPaths } = require('./learning_path_scraper');

const app = express();
const PORT = process.env.PORT || 3001;

const { ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME } = process.env;

let client;
let index;

if (ALGOLIA_APP_ID && ALGOLIA_API_KEY) {
  try {
    client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY); 
    index = client.initIndex(ALGOLIA_INDEX_NAME || 'jopmatch-ai');
    console.log(`Algolia initialized and ready to search on index: ${ALGOLIA_INDEX_NAME}`);
  } catch (error) {
    console.error('Error initializing Algolia client:', error);
  }
} else {
  console.warn('Algolia API keys are not defined. Search will be unavailable.');
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: frontendUrl }));
app.use(express.json());

// --- Search Endpoint ---
app.get('/search-proxy', async (req, res) => {
  const { q: query, type } = req.query;
  if (!query) return res.status(400).json({ error: 'Search query (q) is required.' });
  if (!index) return res.status(503).json({ error: 'Search service is unavailable.' });

  try {
    const searchOptions = { hitsPerPage: 15, filters: type ? `type:${type}` : '' };
    const algoliaResponse = await index.search(query, searchOptions);
    res.json({ results: algoliaResponse.hits });
  } catch (error) {
    console.error('Algolia search error:', error);
    res.status(500).json({ error: 'An error occurred during search.', details: error.message });
  }
});

// --- Scraper Trigger Endpoints ---
app.post('/api/scrape-jobs', async (req, res) => {
  console.log('Received manual request to scrape jobs.');
  try {
    await scrapeAndIndexJobs();
    res.status(200).json({ message: 'Job scraping process completed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete job scraping.' });
  }
});

app.post('/api/scrape-learning', async (req, res) => {
  console.log('Received manual request to scrape learning paths.');
  try {
    await scrapeAndIndexLearningPaths();
    res.status(200).json({ message: 'Learning path scraping process completed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete learning path scraping.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
  console.log(`CORS allowing requests from: ${frontendUrl}`);
  
  const SCRAPE_INTERVAL = 3600000; // 1 hour

  const runScrapers = () => {
    console.log('Running scheduled scrapers...');
    scrapeAndIndexJobs();
    scrapeAndIndexLearningPaths();
  };

  runScrapers(); // Run once on startup
  setInterval(runScrapers, SCRAPE_INTERVAL);
});
