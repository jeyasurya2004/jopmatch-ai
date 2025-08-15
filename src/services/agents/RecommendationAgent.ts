import axios from 'axios';
import { groqService } from '../groq'; // Import the groqService
import { LearningPath } from '../../types';

// --- Configuration for Google Custom Search API from .env file ---
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_SEARCH_ENGINE_ID;
const GOOGLE_API_URL = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;

interface RecommendationResult {
  learningPaths: LearningPath[];
  summary: string;
}

export class RecommendationAgent {
  async generateRecommendations(resumeData: any, jobRole: string, missingSkills: string[]): Promise<RecommendationResult> {
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('RecommendationAgent: Google API Key or Search Engine ID not configured.');
      return { learningPaths: [], summary: 'API not configured.' };
    }

    try {
      // --- Step 1: Get raw learning resources from Google Search (including YouTube) ---
      console.log('RecommendationAgent: Fetching raw learning resources from Google for:', jobRole);
      const searchQuery = `(youtube.com OR freecodecamp.org OR udemy.com) learning paths or tutorials for ${jobRole} focusing on ${missingSkills.join(" OR ")}`;
      const searchResponse = await axios.get(`${GOOGLE_API_URL}&q=${encodeURIComponent(searchQuery)}`);
      const searchResults = searchResponse.data.items || [];

      if (searchResults.length === 0) {
        return { learningPaths: [], summary: 'Could not find any relevant learning resources.' };
      }

      // Format the search results as a string context for the LLM
      const searchContext = searchResults.map((item: any) => 
        `Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}`
      ).join('\n---\n');

      // --- Step 2: Send search results to the LLM for processing ---
      console.log('RecommendationAgent: Sending learning resources to LLM for analysis.');
      const llmResponse = await groqService.generateRecommendations(
        JSON.stringify(resumeData),
        jobRole,
        missingSkills.join(', '),
        searchContext // Pass the search results as context
      );

      const parsedLlmResponse = JSON.parse(llmResponse);

      return {
        learningPaths: parsedLlmResponse.learningPathSuggestions || [],
        summary: parsedLlmResponse.summary || 'Here are your personalized learning recommendations.',
      };

    } catch (error: any) {
      console.error('RecommendationAgent: Error in the recommendation generation process:', error);
      const errorMessage = error.message || 'An unexpected error occurred while generating recommendations.';
      return {
        learningPaths: [{
          title: 'Error Generating Recommendations',
          skillCovered: 'Error',
          description: errorMessage,
          provider: 'System',
          link: '#'
        }],
        summary: 'Failed to generate recommendations.',
      };
    }
  }
}

export const recommendationAgent = new RecommendationAgent();
