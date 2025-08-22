import axios from 'axios';
import { LearningPath } from '../../types';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_SEARCH_ENGINE_ID;
const GOOGLE_API_URL = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;

interface RecommendationResult {
  learningPaths: LearningPath[];
  summary: string;
}

export class RecommendationAgent {
  async generateRecommendations(_resumeData: any, jobRole: string, missingSkills: string[]): Promise<RecommendationResult> {
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('RecommendationAgent: API Key or Search Engine ID not configured in .env file.');
      return {
        learningPaths: [],
        summary: 'API is not configured. Please ensure VITE_GOOGLE_API_KEY and VITE_SEARCH_ENGINE_ID are set in your .env file.',
      };
    }
    
    try {
      console.log('RecommendationAgent: Fetching learning paths for:', jobRole);
      
      const generalQuery = `free courses and tutorials for ${jobRole} focusing on ${missingSkills.join(" OR ")}`;
      const youtubeQuery = `${jobRole} tutorial ${missingSkills.join(" OR ")}`;

      const [generalResponse, videoResponse] = await Promise.all([
        axios.get(`${GOOGLE_API_URL}&q=${encodeURIComponent(generalQuery)}`),
        axios.get(`${GOOGLE_API_URL}&q=${encodeURIComponent(youtubeQuery)}&siteSearch=youtube.com`)
      ]);

      const generalResults = generalResponse.data.items || [];
      const videoResults = videoResponse.data.items || [];

      const allResults = [...generalResults, ...videoResults];
      const uniqueResults = Array.from(new Map(allResults.map(item => [item.link, item])).values());

      const learningPaths: LearningPath[] = uniqueResults.slice(0, 8).map((item: any) => ({
        title: item.title,
        description: item.snippet,
        skillCovered: missingSkills.join(', '),
        provider: item.displayLink,
        link: item.link,
      }));
      
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