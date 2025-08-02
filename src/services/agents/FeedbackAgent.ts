import { groqService } from '../groq';

interface FeedbackResult {
  strengths: string[];
  areasForImprovement: string[];
  keyRecommendations: Array<{
    category: string;
    recommendation: string;
    impact: string;
  }>;
  nextSteps: string[];
  encouragement?: string; // Made optional
  readinessLevel?: string; // Made optional
  timeToJobReady?: string; // Made optional
  overallReadinessScore: number; // Renamed and made mandatory
  summary: string; // Made mandatory
}

class FeedbackAgent {
  async generateFeedback(allAgentOutputs: any): Promise<FeedbackResult> {
    try {
      console.log('FeedbackAgent: Generating feedback with all agent outputs:', allAgentOutputs);
      
      const resumeData = allAgentOutputs.resumeData?.text || 'No resume data provided.';
      
      const response = await groqService.generateFeedback(
        resumeData,
        allAgentOutputs
      );
      
      console.log('FeedbackAgent: Raw result from GroqService:', response);
      
      let responseData: any;
      try {
        responseData = JSON.parse(response);
      } catch (parseError) {
        console.error('FeedbackAgent: Error parsing JSON response from GroqService:', parseError);
        responseData = {};
      }
      
      // Handle potential 'feedback' wrapper object
      if (responseData.feedback && typeof responseData.feedback === 'object') {
        responseData = { ...responseData.feedback, ...responseData };
      }
      
      // --- Strict Data Validation and Structuring ---
      
      const score = responseData.overallReadinessScore ?? responseData.overallScore ?? 50;
      const overallReadinessScore = Math.max(0, Math.min(100, Math.round(score)));

      const summary: string = responseData.summary || 'No summary provided.';
      
      const strengths: string[] = Array.isArray(responseData.strengths) ? responseData.strengths.filter((item: any) => typeof item === 'string') : [];
      
      const areasForImprovement: string[] = Array.isArray(responseData.areasForImprovement) ? responseData.areasForImprovement.filter((item: any) => typeof item === 'string') : [];

      // **FIXED LOGIC HERE**
      // This now handles both strings and objects in the keyRecommendations array.
      const keyRecommendations: FeedbackResult['keyRecommendations'] = [];
      if (Array.isArray(responseData.keyRecommendations)) {
        responseData.keyRecommendations.forEach((rec: any) => {
          if (typeof rec === 'string') {
            // If the recommendation is just a string, wrap it in the object structure.
            keyRecommendations.push({
              category: 'General', // Provide a default category
              recommendation: rec,
              impact: 'Important for career growth' // Provide a default impact
            });
          } else if (rec && rec.category && rec.recommendation && rec.impact) {
            // If it's already a well-structured object, use it.
            keyRecommendations.push({
              category: String(rec.category),
              recommendation: String(rec.recommendation),
              impact: String(rec.impact)
            });
          }
        });
      }
      
      const nextSteps: string[] = Array.isArray(responseData.nextSteps) ? responseData.nextSteps.filter((item: any) => typeof item === 'string') : [];
      
      const feedbackResponse: FeedbackResult = {
        overallReadinessScore,
        summary,
        strengths,
        areasForImprovement,
        keyRecommendations,
        nextSteps,
        encouragement: responseData.encouragement,
        readinessLevel: responseData.readinessLevel,
        timeToJobReady: responseData.timeToJobReady,
      };
      
      console.log('FeedbackAgent: Final structured feedback response:', feedbackResponse);
      
      return feedbackResponse;
      
    } catch (error) {
      console.error('FeedbackAgent: Error generating feedback:', error);
      // Return a structured fallback response on any processing error
      return {
        overallReadinessScore: 0,
        summary: 'An error occurred while generating feedback. Please try again.',
        strengths: [],
        areasForImprovement: [],
        keyRecommendations: [],
        nextSteps: [],
      };
    }
  }
}

export const feedbackAgent = new FeedbackAgent();
