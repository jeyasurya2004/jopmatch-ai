import { searchAgent, SearchAgent } from './SearchAgent';

export class JobFetcherAgent {
  private searchAgent: SearchAgent;

  constructor(searchAgentInstance: SearchAgent) {
    this.searchAgent = searchAgentInstance;
  }

  async fetchJobs(resumeData: any, jobRole: string): Promise<any> {
    try {
      console.log('JobFetcherAgent: Fetching jobs for role:', jobRole);

      // Use the SearchAgent to find jobs of type 'job'
      const searchResults = await this.searchAgent.search(jobRole, 'job');
      
      console.log('JobFetcherAgent: Jobs found by SearchAgent:', searchResults);

      // Format the results to match the expected output structure
      const jobSuggestions = searchResults.map(job => ({
        title: job.title,
        company: job.company || 'N/A', // Ensure company is not undefined
        location: job.location || 'Remote', // Default to remote if not specified
        description: job.snippet,
        url: job.url,
      }));

      return {
        searchQuery: jobRole,
        jobSuggestions: jobSuggestions,
      };
      
    } catch (error) {
      console.error('JobFetcherAgent: Error fetching jobs:', error);
      throw error;
    }
  }

  // The private methods createProfileSummary and cleanJsonResponse are no longer needed
  // as we are not interacting with the Groq service for job fetching anymore.
}

// Pass the searchAgent instance to the JobFetcherAgent constructor
export const jobFetcherAgent = new JobFetcherAgent(searchAgent);
