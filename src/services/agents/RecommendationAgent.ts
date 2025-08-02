import { groqService } from '../groq';
import { searchAgent } from './SearchAgent';
import { LearningPath } from '../../types';

// Helper function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RecommendationResult {
  learningPaths: LearningPath[];
  summary: string;
}

export class RecommendationAgent {
  async generateRecommendations(resumeData: any, jobRole: string, missingSkills: string[]): Promise<RecommendationResult> {
    try {
      console.log('RecommendationAgent: Generating recommendation ideas for:', jobRole);
      
      const resumeSummary = resumeData.summary || JSON.stringify(resumeData);
      const skillGaps = missingSkills.join(", ");

      // Step 1: Get learning path suggestions from the LLM (without links)
      const suggestionsResult = await groqService.generateRecommendations(resumeSummary, jobRole, skillGaps);
      
      let suggestions: any;
      try {
          suggestions = JSON.parse(suggestionsResult);
      } catch (e) {
          console.error('RecommendationAgent: Failed to parse suggestions JSON.', e);
          return { learningPaths: [], summary: "Could not generate a learning path." };
      }

      const learningPathSuggestions = suggestions.learningPathSuggestions || [];
      const summary = suggestions.summary || 'Here is a tailored learning path to help you bridge your skill gaps.';
      
      // Step 2: Use the SearchAgent to find real links for each suggestion
      const enrichedLearningPaths: LearningPath[] = [];

      for (const suggestion of learningPathSuggestions) {
        // Formulate a targeted search query
        const query = `${suggestion.skillCovered} course ${suggestion.provider} free`;
        const searchResults = await searchAgent.search(query, 1); // Get the top 1 result

        if (searchResults.length > 0) {
          const topResult = searchResults[0];
          enrichedLearningPaths.push({
            title: suggestion.title,
            skillCovered: suggestion.skillCovered,
            description: suggestion.description,
            link: topResult.url, // Use the real URL from the search result
            provider: suggestion.provider,
          });
        }

        // **FIXED HERE**: Introduce a small delay between search requests
        await delay(300); // Wait for 300 milliseconds between searches
      }

      console.log('RecommendationAgent: Enriched learning paths with real links:', enrichedLearningPaths);
      
      return {
        learningPaths: enrichedLearningPaths,
        summary: summary,
      };
      
    } catch (error) {
      console.error('RecommendationAgent: Error generating recommendations:', error);
      return {
        learningPaths: [],
        summary: 'An unexpected error occurred while generating your learning path.',
      };
    }
  }
}

export const recommendationAgent = new RecommendationAgent();
