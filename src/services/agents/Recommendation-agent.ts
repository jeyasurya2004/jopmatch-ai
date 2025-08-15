import axios from 'axios';
import { LearningPath } from '../../types';

// --- NEW: Configuration for Google Custom Search API from .env file ---
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_SEARCH_ENGINE_ID;
const GOOGLE_API_URL = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;

interface RecommendationResult {
  learningPaths: LearningPath[];
  summary: string;
}

// --- UPDATED: RecommendationAgent using Google Custom Search ---
export class RecommendationAgent {
  async generateRecommendations(resumeData: any, jobRole: string, missingSkills: string[]): Promise<RecommendationResult> {
    // Basic check to ensure the user has configured the keys
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('RecommendationAgent: API Key or Search Engine ID not configured in .env file.');
      return {
        learningPaths: [],
        summary: 'API is not configured. Please ensure VITE_GOOGLE_API_KEY and VITE_SEARCH_ENGINE_ID are set in your .env file.',
      };
    }

    try {
      console.log('RecommendationAgent: Fetching learning paths for:', jobRole);

      // The search query sent to Google
      const query = `free learning paths for ${jobRole} tutorial focusing on ${missingSkills.join(" OR ")}`;

      // --- NEW: Calling Google Custom Search API directly ---
      const response = await axios.get(`${GOOGLE_API_URL}&q=${encodeURIComponent(query)}`);

      // Add console log for the raw Google Search API response
      console.log('RecommendationAgent: Raw Google Search API Response:', response.data);

      const searchResults = response.data.items || [];

      // --- NEW: Mapping Google's response to our app's format ---
      const learningPaths: LearningPath[] = searchResults.slice(0, 5).map((item: any) => ({
        title: item.title,
        description: item.snippet,
        skill: missingSkills.join(', '), // Assign the searched skills
        provider: item.displayLink, // Use the domain as the provider
        url: item.link,
      }));

      // Add console log for the mapped learningPaths data
      console.log('RecommendationAgent: Mapped Learning Paths:', learningPaths);


      if (learningPaths.length === 0) {
        return {
          learningPaths: [],
          summary: 'Could not find any relevant learning paths. Try adjusting your job role or skills.',
        };
      }

      return {
        learningPaths: learningPaths,
        summary: `Here are the top learning resources found for a ${jobRole}.`
      };

    } catch (error: any) {
      console.error('RecommendationAgent: Error fetching recommendations from Google API:', error);
      const errorMessage = error.response?.data?.error?.message || 'An unexpected error occurred while fetching learning resources.';
      return {
        learningPaths: [],
        summary: `Error: ${errorMessage}`,
      };
    }
  }
}

export const recommendationAgent = new RecommendationAgent();
