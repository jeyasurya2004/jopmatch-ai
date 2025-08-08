const { ApifyClient } = require('apify-client');
const algoliasearch = require('algoliasearch');

// This function calls a pre-built Coursera scraper on the Apify platform.
async function scrapeAndIndexLearningPaths() {
  console.log('Starting Apify client for learning path scraping...');

  const { APIFY_API_TOKEN, ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME } = process.env;

  if (!APIFY_API_TOKEN) throw new Error('APIFY_API_TOKEN not found in environment.');
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) throw new Error('Algolia credentials not configured.');

  const apifyClient = new ApifyClient({ token: APIFY_API_TOKEN });
  const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME || 'jopmatch-ai');

  try {
    // Corrected to use a specific, public actor for Coursera
    const actorName = 'drobnikj/coursera-scraper'; 

    console.log(`Running Apify actor: ${actorName} to scrape Coursera...`);
    
    const actorInput = {
      "query": "developer",
      "maxItems": 20, // Keep it low to stay within free limits
      "language": "en"
    };

    const run = await apifyClient.actor(actorName).call(actorInput);

    console.log('Apify actor run finished. Fetching results...');
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      console.log('No courses found from the Apify scrape. The actor might be running or found no results.');
      return;
    }

    const coursesToSave = items.map(item => ({
      type: 'course',
      title: item.title,
      provider: 'Coursera',
      snippet: 'A course on Coursera.', // The scraper provides limited snippet data
      url: item.url,
      objectID: `course-coursera-${item.id}`
    }));

    console.log(`Found a total of ${coursesToSave.length} courses. Saving to Algolia...`);
    await index.saveObjects(coursesToSave);
    console.log('Successfully saved learning paths to Algolia.');

  } catch (error)_message
    console.error('An error occurred during the Apify learning path scrape:', error);
  }
}

module.exports = { scrapeAndIndexLearningPaths };
