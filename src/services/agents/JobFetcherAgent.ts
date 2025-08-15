import axios from 'axios';
import { groqService } from '../groq'; // Import the groqService
import { JobSuggestion } from '../../types';

// --- Configuration for Google Custom Search API from .env file ---
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_SEARCH_ENGINE_ID;
const GOOGLE_API_URL = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;

interface JobFetcherResult {
  searchQuery: string;
  jobSuggestions: JobSuggestion[];
}

export class JobFetcherAgent {
  async fetchJobs(resumeData: any, jobRole: string): Promise<JobFetcherResult> {
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('JobFetcherAgent: Google API Key or Search Engine ID not configured.');
      return { searchQuery: jobRole, jobSuggestions: [] };
    }

    try {
      // --- Step 1: Get raw job listings from Google Search ---
      console.log('JobFetcherAgent: Fetching raw job listings from Google for:', jobRole);
      const searchQuery = `job openings for ${jobRole} on LinkedIn or Indeed`;
      const searchResponse = await axios.get(`${GOOGLE_API_URL}&q=${encodeURIComponent(searchQuery)}`);
      const searchResults = searchResponse.data.items || [];

      if (searchResults.length === 0) {
        return { searchQuery: jobRole, jobSuggestions: [] };
      }
      
      // Format the search results as a string context for the LLM
      const searchContext = searchResults.map((item: any) => 
        `Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}`
      ).join('\n---\n');

      // --- Step 2: Send search results to the LLM for processing ---
      console.log('JobFetcherAgent: Sending search results to LLM for analysis.');
      const llmResponse = await groqService.fetchJobMatches(
        JSON.stringify(resumeData), 
        jobRole, 
        searchContext // Pass the search results as context
      );
      
      // *** DEBUGGING: Log the raw response from the LLM ***
      console.log('JobFetcherAgent: Raw LLM Response:', llmResponse);
            
      const parsedLlmResponse = JSON.parse(llmResponse);

      return {
        searchQuery: jobRole,
        jobSuggestions: parsedLlmResponse.jobs || [],
      };
      
    } catch (error: any) {
      console.error('JobFetcherAgent: Error in the job fetching process:', error);
      const errorMessage = error.message || 'An unexpected error occurred while fetching jobs.';
      return {
        searchQuery: jobRole,
        jobSuggestions: [{
          title: 'Error Processing Job Suggestions',
          company: 'System',
          location: 'N/A',
          description: errorMessage,
          url: '#'
        }],
      };
    }
  }
}

export const jobFetcherAgent = new JobFetcherAgent();
