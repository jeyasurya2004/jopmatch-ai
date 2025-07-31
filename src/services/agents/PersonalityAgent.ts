import { groqService } from '../groq';

export class PersonalityAgent {
  async analyzePersonality(resumeData: any): Promise<any> {
    try {
      console.log('PersonalityAgent: Analyzing personality from resume data');
      
      // Use groqService to make the API call with rate limiting
      const personalityAnalysisResult = await groqService.analyzePersonality(JSON.stringify(resumeData));
      
      const result = personalityAnalysisResult;
      console.log('PersonalityAgent: Raw personality analysis:', result);
      
      const cleanedResponse = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResponse);
      
      return {
        mbtiType: parsed.mbtiType || 'XXXX',
        openness: parsed.bigFive?.openness || 0.5,
        conscientiousness: parsed.bigFive?.conscientiousness || 0.5,
        extraversion: parsed.bigFive?.extraversion || 0.5,
        agreeableness: parsed.bigFive?.agreeableness || 0.5,
        neuroticism: parsed.bigFive?.neuroticism || 0.5,
        softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
        workStyle: parsed.workStyle || 'Collaborative and detail-oriented',
        summary: parsed.summary || 'Personality analysis based on resume content'
      };
      
    } catch (error) {
      console.error('PersonalityAgent: Error analyzing personality:', error);
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
    
    // Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    return cleaned;
  }
}

export const personalityAgent = new PersonalityAgent();