const algoliasearch = require('algoliasearch'); // Import the main Algolia search client
const dotenv = require('dotenv');

console.log('algoliasearch object after require:', algoliasearch);

dotenv.config({ path: './backend/.env' });

const algoliaAppId = process.env.ALGOLIA_APP_ID;
const algoliaAdminApiKey = process.env.ALGOLIA_ADMIN_API_KEY; // This should be your Write/Admin API Key
const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || 'jopmatch-ai';

if (!algoliaAppId || !algoliaAdminApiKey) {
  console.error('Please ensure ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY are set in backend/.env');
  process.exit(1);
}

let client;
let index;

try {
  // Attempt to initialize the client using the nested property
  client = algoliasearch.algoliasearch(algoliaAppId, algoliaAdminApiKey);

  console.log('Type of client after initialization:', typeof client);
  console.log('Client object after initialization:', client);

  // Attempt to get the index from the client
  index = client.initIndex(algoliaIndexName);
  console.log('Index object after initIndex:', index);

} catch (error) {
  console.error('Error during Algolia client/index initialization:', error);
  process.exit(1);
}

const dummyRecords = [
  { objectID: 'course-1', title: 'Introduction to JavaScript', url: 'https://www.freecodecamp.org/news/javascript-for-beginners/', snippet: 'A comprehensive guide to JavaScript fundamentals.', categories: ['JavaScript', 'Frontend'] },
  { objectID: 'course-2', title: 'React Basics and Hooks', url: 'https://react.dev/learn', snippet: 'Learn React from the official documentation with hooks.', categories: ['React', 'Frontend'] },
  { objectID: 'course-3', title: 'Node.js for Backend Development', url: 'https://nodejs.org/en/docs', snippet: 'Official Node.js documentation and guides.', categories: ['Node.js', 'Backend'] },
  { objectID: 'course-4', title: 'Python Crash Course', url: 'https://www.python.org/doc/', snippet: 'Official Python documentation and tutorials.', categories: ['Python', 'Data Science'] },
  { objectID: 'course-5', title: 'MongoDB University M001', url: 'https://learn.mongodb.com/courses/m001-mongodb-basics', snippet: 'MongoDB Basics course from MongoDB University.', categories: ['MongoDB', 'Database'] },
  { objectID: 'job-1', title: 'Senior Frontend Developer', url: 'https://example.com/job/frontend', snippet: 'Exciting opportunity for a senior React developer.', type: 'Job', skills: ['React', 'TypeScript', 'CSS'] },
  { objectID: 'job-2', title: 'Backend Engineer - Node.js', url: 'https://example.com/job/backend', snippet: 'Build scalable APIs with Node.js and Express.', type: 'Job', skills: ['Node.js', 'Express', 'MongoDB'] },
];

index.saveObjects(dummyRecords, { autoGenerateObjectIDIfNotExist: true })
  .then(() => {
    console.log('Dummy records added to Algolia index successfully!');
  })
  .catch(error => {
    console.error('Error adding dummy records to Algolia:', error);
  });
