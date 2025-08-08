const { ApifyClient } = require('apify-client');
const algoliasearch = require('algoliasearch');

// This function calls a pre-built LinkedIn scraper on the Apify platform.
async function scrapeAndIndexJobs() {
  console.log('Starting Apify client for job scraping...');
  
  const { APIFY_API_TOKEN, ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME } = process.env;

  if (!APIFY_API_TOKEN) throw new Error('APIFY_API_TOKEN not found in environment.');
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) throw new Error('Algolia credentials not configured.');

  const apifyClient = new ApifyClient({ token: APIFY_API_TOKEN });
  const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME || 'jopmatch-ai');

  try {
    // Corrected to use a specific, public actor for LinkedIn jobs
    const actorName = 'lukas-han/linkedin-jobs-scraper';
    
    console.log(`Running Apify actor: ${actorName} to scrape LinkedIn jobs...`);
    
    const actorInput = {
      "searchQueries": ["remote software developer", "remote data scientist"],
      "maxResults": 20, // Keep it low to stay within free limits
      "endPage": 1
    };

    const run = await apifyClient.actor(actorName).call(actorInput);
    
    console.log('Apify actor run finished. Fetching results...');
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log('No jobs found from the Apify scrape. The actor might be running or found no results.');
      return;
    }

    const jobsToSave = items.map(item => ({
      type: 'job',
      title: item.title,
      company: item.company,
      location: item.place,
      snippet: item.description,
      url: item.link,
      objectID: `job-linkedin-${item.jobId}`
    }));

    console.log(`Found a total of ${jobsToSave.length} jobs. Saving to Algolia...`);
    await index.saveObjects(jobsToSave);
    console.log('Successfully saved jobs to Algolia.');

  } catch (error) {
    console.error('An error occurred during the Apify job scrape:', error);
  }
}

module.exports = { scrapeAndIndexJobs };
