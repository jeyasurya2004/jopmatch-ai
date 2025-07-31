import { groqService } from '../groq';

export class RecommendationAgent {
  async generateRecommendations(resumeData: any, jobRole: string, missingSkills: string[]): Promise<any> {
    try {
      console.log('RecommendationAgent: Generating recommendations for role:', jobRole);
      
      // Use groqService to make the API call with rate limiting
      const skillGaps = missingSkills.join(", ");
      const recommendationsResult = await groqService.generateRecommendations(JSON.stringify(resumeData), jobRole, skillGaps);
      
      const result = recommendationsResult;
      console.log('RecommendationAgent: Raw recommendations:', result);
      
      const cleanedResponse = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResponse);
      
      return {
        learningPaths: Array.isArray(parsed.learningPaths) ? parsed.learningPaths : [],
        overallPath: parsed.overallPath || 'Follow the recommended learning paths sequentially',
        estimatedTimeToCompletion: parsed.estimatedTimeToCompletion || '3-6 months'
      };
      
    } catch (error) {
      console.error('RecommendationAgent: Error generating recommendations:', error);
      throw error;
    }
  }

  private cleanJsonResponse(response: string): string {
    let cleaned = response.trim();
    
    // Find JSON content
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // Remove control characters that can cause JSON parsing to fail
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    return cleaned;
  }
}

export const recommendationAgent = new RecommendationAgent();