const { searchClient } = require('@algolia/client-search');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const algoliaAppId = process.env.ALGOLIA_APP_ID;
const algoliaAdminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || 'jopmatch-ai';

if (!algoliaAppId || !algoliaAdminApiKey) {
  console.error('Please ensure ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY are set in backend/.env');
  process.exit(1);
}

const client = searchClient(algoliaAppId, algoliaAdminApiKey);
const index = client.initIndex(algoliaIndexName);

const comprehensiveRecords = [
  // --- Learning Courses ---
  { objectID: 'course-js', type: 'course', title: 'JavaScript Full Course', url: 'https://www.freecodecamp.org/news/javascript-for-beginners/', snippet: 'A comprehensive guide to JavaScript fundamentals.', categories: ['JavaScript', 'Frontend'] },
  { objectID: 'course-react', type: 'course', title: 'React Official Tutorial', url: 'https://react.dev/learn', snippet: 'Learn React from the official documentation with hooks.', categories: ['React', 'Frontend'] },
  { objectID: 'course-ts', type: 'course', title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', snippet: 'The official handbook for TypeScript.', categories: ['TypeScript', 'Frontend'] },
  { objectID: 'course-node', type: 'course', title: 'Node.js Official Guides', url: 'https://nodejs.org/en/docs/guides', snippet: 'Official Node.js documentation and guides.', categories: ['Node.js', 'Backend'] },
  { objectID: 'course-python', type: 'course', title: 'Python for Beginners', url: 'https://www.python.org/doc/', snippet: 'Official Python documentation and tutorials.', categories: ['Python', 'Data Science', 'Backend'] },
  { objectID: 'course-mongo', type: 'course', title: 'MongoDB University M001', url: 'https://learn.mongodb.com/courses/m001-mongodb-basics', snippet: 'MongoDB Basics course from MongoDB University.', categories: ['MongoDB', 'Database'] },
  { objectID: 'course-sql', type: 'course', title: 'SQL Essential Training', url: 'https://www.linkedin.com/learning/sql-essential-training-4', snippet: 'Learn the fundamentals of SQL for database management.', categories: ['SQL', 'Database'] },
  { objectID: 'course-docker', type: 'course', title: 'Docker Official Getting Started', url: 'https://docs.docker.com/get-started/', snippet: 'Learn how to build and share containerized applications.', categories: ['Docker', 'DevOps'] },
  { objectID: 'course-k8s', type: 'course', title: 'Kubernetes Basics Tutorial', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', snippet: 'Interactive tutorial to learn the basics of Kubernetes.', categories: ['Kubernetes', 'DevOps'] },
  { objectID: 'course-aws', type: 'course', title: 'AWS Cloud Practitioner Essentials', url: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/', snippet: 'Foundational knowledge of the AWS Cloud.', categories: ['AWS', 'Cloud', 'DevOps'] },
  { objectID: 'course-cicd', type: 'course', title: 'CI/CD with Jenkins', url: 'https://www.jenkins.io/doc/book/pipeline/', snippet: 'Learn how to create and manage CI/CD pipelines with Jenkins.', categories: ['CI/CD', 'Jenkins', 'DevOps'] },
  { objectID: 'course-linux', type: 'course', title: 'Introduction to Linux', url: 'https://training.linuxfoundation.org/training/introduction-to-linux/', snippet: 'A free course from the Linux Foundation.', categories: ['Linux', 'DevOps'] },
  { objectID: 'course-ml', type: 'course', title: 'Machine Learning Crash Course by Google', url: 'https://developers.google.com/machine-learning/crash-course', snippet: 'A fast-paced, practical introduction to machine learning.', categories: ['Machine Learning', 'Data Science'] },
  { objectID: 'course-stats', type: 'course', title: 'Statistics and Probability by Khan Academy', url: 'https://www.khanacademy.org/math/statistics-probability', snippet: 'Learn the core principles of statistics and probability.', categories: ['Statistics', 'Data Science'] },

  // --- Job Postings ---
  { objectID: 'job-frontend-sr', type: 'job', title: 'Senior Frontend Developer', company: 'TechSolutions Inc.', url: 'https://example.com/job/frontend-sr', snippet: 'Lead the development of our flagship product’s UI using React and TypeScript.', skills: ['React', 'TypeScript', 'CSS', 'JavaScript'] },
  { objectID: 'job-backend-node', type: 'job', title: 'Backend Engineer - Node.js', company: 'DataCore Systems', url: 'https://example.com/job/backend-node', snippet: 'Build and maintain scalable APIs and services with Node.js and Express.', skills: ['Node.js', 'Express', 'MongoDB', 'REST API'] },
  { objectID: 'job-fullstack', type: 'job', title: 'Full Stack Engineer', company: 'Innovate LLC', url: 'https://example.com/job/fullstack', snippet: 'Work on both our frontend and backend systems, from UI to database.', skills: ['React', 'Node.js', 'SQL', 'JavaScript'] },
  { objectID: 'job-datascientist', type: 'job', title: 'Data Scientist', company: 'Insight Analytics', url: 'https://example.com/job/data-scientist', snippet: 'Analyze large datasets and build predictive models using Python and Machine Learning.', skills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'TensorFlow'] },
  { objectID: 'job-devops', type: 'job', title: 'DevOps Engineer', company: 'CloudNet Deployments', url: 'https://example.com/job/devops', snippet: 'Manage our CI/CD pipelines, cloud infrastructure, and container orchestration.', skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'] },
  { objectID: 'job-frontend-jr', type: 'job', title: 'Junior Frontend Developer', company: 'WebWeavers Co.', url: 'https://example.com/job/frontend-jr', snippet: 'Join our team to build beautiful and responsive user interfaces.', skills: ['HTML', 'CSS', 'JavaScript', 'React'] },
];

// Using replaceAllObjects to ensure the index is fresh with this new data
index.replaceAllObjects(comprehensiveRecords, {
  autoGenerateObjectIDIfNotExist: true,
}).then(({ objectIDs }) => {
  console.log(`Comprehensive records have been successfully added/updated in the index!`);
}).catch(error => {
  console.error('Error replacing records in Algolia:', error);
});
