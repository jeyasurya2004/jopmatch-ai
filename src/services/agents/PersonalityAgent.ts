import { groqService } from '../groq';

export class PersonalityAgent {
  async analyzePersonality(resumeData: any): Promise<any> {
    try {
      console.log('PersonalityAgent: Analyzing personality from resume data');
      
      const personalityAnalysisResult = await groqService.analyzePersonality(JSON.stringify(resumeData));
      
      const result = personalityAnalysisResult;
      console.log('PersonalityAgent: Raw personality analysis:', result);
      
      const cleanedResponse = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResponse);
      
      // FIX: Changed from parsed.bigFive?.<trait> to parsed.<trait> to match the flat JSON structure from the API
      return {
        mbtiType: parsed.mbtiType || 'XXXX',
        openness: parsed.openness || 0.5,
        conscientiousness: parsed.conscientiousness || 0.5,
        extraversion: parsed.extraversion || 0.5,
        agreeableness: parsed.agreeableness || 0.5,
        neuroticism: parsed.neuroticism || 0.5,
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
    
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    return cleaned;
  }
}

export const personalityAgent = new PersonalityAgent();