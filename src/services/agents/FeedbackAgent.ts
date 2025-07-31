import { groqService } from '../groq';

interface FeedbackResult {
  strengths: string[];
  areasForImprovement: string[];
  recommendations: Array<{
    category: string;
    recommendation: string;
    impact: string;
  }>;
  nextSteps: string[];
  encouragement: string;
  readinessLevel: string;
  timeToJobReady: string;
  overallScore: number;
  summary: string;
  keyRecommendations: Array<{
    category: string;
    recommendation: string;
    impact: string;
  }>;
}

class FeedbackAgent {
  async generateFeedback(allAgentOutputs: any): Promise<FeedbackResult> {
    try {
      console.log('FeedbackAgent: Generating feedback with all agent outputs:', allAgentOutputs);
      
      // Get the resume data
      const resumeData = allAgentOutputs.resumeData;
      
      // Generate feedback using GroqService
      const response = await groqService.generateFeedback(
        resumeData.text,
        JSON.stringify(allAgentOutputs, null, 2)
      );
      
      console.log('FeedbackAgent: Raw result from GroqService:', response);
      
      // Parse the response if it's a string
      let responseData: any;
      if (typeof response === 'string') {
        try {
          responseData = JSON.parse(response);
        } catch (parseError) {
          console.error('FeedbackAgent: Error parsing JSON response:', parseError);
          responseData = {};
        }
      } else {
        responseData = response;
      }
      
      // Handle responses wrapped in feedback object
      if (responseData.feedback && typeof responseData.feedback === 'object') {
        console.log('FeedbackAgent: Found feedback wrapper, extracting data');
        responseData = { ...responseData, ...responseData.feedback };
      }
      
      // Extract mapped recommendations from various sources
      let mappedRecommendations: Array<{
        category: string;
        recommendation: string;
        impact: string;
      }> = [];
      
      // Extract recommendations from keyRecommendations if available
      if (Array.isArray(responseData.keyRecommendations)) {
        responseData.keyRecommendations.forEach((rec: any) => {
          if (typeof rec === 'string') {
            mappedRecommendations.push({
              category: "Key Recommendation",
              recommendation: rec,
              impact: "Career Development"
            });
          } else if (rec.category && rec.recommendation) {
            mappedRecommendations.push(rec);
          } else if (rec.action && rec.reason) {
            mappedRecommendations.push({
              category: "Key Recommendation",
              recommendation: rec.action,
              impact: rec.reason
            });
          } else if (rec.action && rec.suggestedActivities) {
            mappedRecommendations.push({
              category: "Key Recommendation",
              recommendation: rec.action,
              impact: Array.isArray(rec.suggestedActivities) ? rec.suggestedActivities.join(', ') : rec.suggestedActivities
            });
          } else {
            // Fallback for unknown format
            mappedRecommendations.push({
              category: "Key Recommendation",
              recommendation: JSON.stringify(rec),
              impact: "Career Development"
            });
          }
        });
      }
      
      // Extract recommendations from formattingFeedback if available
      if (responseData.formattingFeedback && Array.isArray(responseData.formattingFeedback.suggestions)) {
        mappedRecommendations.push(...responseData.formattingFeedback.suggestions.map((suggestion: string) => ({
          category: "Formatting Improvement",
          recommendation: suggestion,
          impact: "Improves ATS compatibility"
        })));
      }
      
      // Extract recommendations from contentFeedback if available
      if (responseData.contentFeedback && Array.isArray(responseData.contentFeedback.suggestions)) {
        mappedRecommendations.push(...responseData.contentFeedback.suggestions.map((suggestion: string) => ({
          category: "Content Improvement",
          recommendation: suggestion,
          impact: "Enhances content quality"
        })));
      }
      
      // Extract recommendations from atsOptimization if available
      if (responseData.atsOptimization && Array.isArray(responseData.atsOptimization.suggestions)) {
        mappedRecommendations.push(...responseData.atsOptimization.suggestions.map((suggestion: string) => ({
          category: "ATS Optimization",
          recommendation: suggestion,
          impact: "Increases interview chances"
        })));
      }
      
      // Extract recommendations from specificRecommendations if available
      if (Array.isArray(responseData.specificRecommendations)) {
        mappedRecommendations.push(...responseData.specificRecommendations.map((rec: string) => ({
          category: "Specific Recommendation",
          recommendation: rec,
          impact: "Career Development"
        })));
      }

      // NOTE: actionableAdvice is now handled by GroqService and mapped to nextSteps
      // We don't want to duplicate it in keyRecommendations
      
      // jobProspects is not needed for recommendations, so we're not mapping it
      
      // Extract next steps from nextSteps field only (avoid duplication with keyRecommendations)
      let mappedNextSteps: string[] = [];
      
      // Check for nextSteps first
      if (Array.isArray(responseData.nextSteps) && responseData.nextSteps.length > 0) {
        responseData.nextSteps.forEach((step: any) => {
          if (typeof step === 'string') {
            mappedNextSteps.push(step);
          } else if (step.action && step.reason) {
            // Object with action/reason format
            mappedNextSteps.push(step.action);
          } else if (step.recommendation) {
            mappedNextSteps.push(step.recommendation);
          } else if (step.suggestion) {
            mappedNextSteps.push(step.suggestion);
          } else {
            mappedNextSteps.push('Follow recommendation: ' + JSON.stringify(step));
          }
        });
      }
      
      // If nextSteps is still empty, try to derive from other fields
      if (mappedNextSteps.length === 0 && Array.isArray(responseData.specificRecommendations)) {
        mappedNextSteps = responseData.specificRecommendations.map((rec: any) => 
          typeof rec === 'string' ? rec : (rec.recommendation || rec.suggestion || rec.action || JSON.stringify(rec))
        );
      }
      
      // NOTE: actionableAdvice should NOT be mapped to nextSteps
      // nextSteps should be generated by the LLM directly
      
      if (mappedNextSteps.length === 0 && Array.isArray(responseData.recommendedNextSteps)) {
        mappedNextSteps = responseData.recommendedNextSteps.map((step: any) => 
          typeof step === 'string' ? step : (step.recommendation || step.suggestion || step.action || JSON.stringify(step))
        );
      }
      
      // Try to extract overallScore from various sources if not directly provided
      let overallScore = responseData.overallScore || (typeof response === 'object' && response !== null ? (response as any).overallScore : undefined);
      if (!overallScore && responseData.formattingFeedback?.score && responseData.contentFeedback?.score && responseData.atsOptimization?.score) {
        // Calculate average if individual scores are available
        overallScore = Math.round((responseData.formattingFeedback.score + responseData.contentFeedback.score + responseData.atsOptimization.score) / 3);
      }
      
      // Construct the final feedback response
      const feedbackResponse: FeedbackResult = {
        strengths: Array.isArray(responseData.strengths) ? responseData.strengths : [],
        areasForImprovement: Array.isArray(responseData.areasForImprovement) 
          ? responseData.areasForImprovement 
          : [],
        recommendations: Array.isArray(responseData.keyRecommendations) && responseData.keyRecommendations.length > 0 ? 
          responseData.keyRecommendations.map((rec: any) => {
            if (typeof rec === 'string') {
              return {
                category: "Key Recommendation",
                recommendation: rec,
                impact: "Career Development"
              };
            } else if (rec.category && rec.recommendation) {
              return rec;
            } else if (rec.action && rec.reason) {
              return {
                category: "Key Recommendation",
                recommendation: rec.action,
                impact: rec.reason
              };
            } else if (rec.action && rec.suggestedActivities) {
              return {
                category: "Key Recommendation",
                recommendation: rec.action,
                impact: Array.isArray(rec.suggestedActivities) ? rec.suggestedActivities.join(', ') : rec.suggestedActivities
              };
            } else {
              return {
                category: "Key Recommendation",
                recommendation: typeof rec === 'string' ? rec : JSON.stringify(rec),
                impact: "Career Development"
              };
            }
          }) : 
          (mappedRecommendations.length > 0 ? mappedRecommendations : []),
        nextSteps: mappedNextSteps.length > 0 
          ? mappedNextSteps 
          : (Array.isArray(responseData.nextSteps) ? responseData.nextSteps : []),
        encouragement: responseData.encouragement || (typeof response === 'object' && response !== null ? (response as any).encouragement : undefined) || 'You have great potential for success in your chosen field!',
        readinessLevel: responseData.readinessLevel || 'intermediate',
        timeToJobReady: responseData.timeToJobReady || '3-6 months',
        // Extract overallScore - try to calculate if not provided
        overallScore: overallScore || 50,
        summary: responseData.summary || (typeof response === 'object' && response !== null ? (response as any).summary : undefined) || 'Comprehensive feedback on your career readiness and development areas.',
        keyRecommendations: Array.isArray(responseData.keyRecommendations) && responseData.keyRecommendations.length > 0 ? 
          responseData.keyRecommendations.map((rec: any) => {
            if (typeof rec === 'string') {
              return {
                category: "Key Recommendation",
                recommendation: rec,
                impact: "Career Development"
              };
            } else if (rec.category && rec.recommendation) {
              return rec;
            } else if (rec.action && rec.reason) {
              return {
                category: "Key Recommendation",
                recommendation: rec.action,
                impact: rec.reason
              };
            } else if (rec.action && rec.suggestedActivities) {
              return {
                category: "Key Recommendation",
                recommendation: rec.action,
                impact: Array.isArray(rec.suggestedActivities) ? rec.suggestedActivities.join(', ') : rec.suggestedActivities
              };
            } else {
              return {
                category: "Key Recommendation",
                recommendation: typeof rec === 'string' ? rec : JSON.stringify(rec),
                impact: "Career Development"
              };
            }
          }) : 
          mappedRecommendations
      };
      
      console.log('FeedbackAgent: Final feedback response:', feedbackResponse);
      console.log('FeedbackAgent: Final keyRecommendations:', feedbackResponse.keyRecommendations);
      return feedbackResponse;
      
    } catch (error) {
      console.error('FeedbackAgent: Error generating feedback:', error);
      // Return a default response structure on error
      return {
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
        nextSteps: [],
        encouragement: 'We encountered an error processing your feedback.',
        readinessLevel: 'evaluation needed',
        timeToJobReady: 'evaluation needed',
        overallScore: 50,
        summary: 'Error processing feedback.',
        keyRecommendations: []
      };
    }
  }

  async adaptRecommendations(feedback: string, currentRecommendations: any): Promise<any> {
    try {
      console.log('FeedbackAgent: Adapting recommendations based on feedback');

      const feedbackData: any = {
        feedback,
        currentRecommendations
      };

      const result = await groqService.generateFeedback('', JSON.stringify(feedbackData));
      return typeof result === 'string' ? JSON.parse(result) : result;
      
    } catch (error) {
      console.error('FeedbackAgent: Error adapting recommendations:', error);
      // Return current recommendations on error to prevent breaking the flow
      return currentRecommendations;
    }
  }
}

export const feedbackAgent = new FeedbackAgent();
