import { groqService } from '../groq';

export class CareerFitAgent {
  async calculateRoleFit(resumeData: any, jobRole: string): Promise<any> {
    try {
      console.log('CareerFitAgent: Calculating role fit for:', jobRole);
      
      // Use groqService to make the API call with rate limiting
      const fitAnalysisResult = await groqService.analyzeRoleFit(JSON.stringify(resumeData), jobRole);
      
      console.log('CareerFitAgent: Raw fit analysis result:', fitAnalysisResult);
      
      const cleanedResponse = this.cleanJsonResponse(fitAnalysisResult);
      const parsed = JSON.parse(cleanedResponse);
      
      // Ensure improvements array only contains strings
      let improvements = parsed.improvements || [];
      if (Array.isArray(improvements)) {
        improvements = improvements.map(item => 
          typeof item === 'string' ? item : 
          typeof item === 'object' ? (item.suggestion || item.area || item.skill || JSON.stringify(item)) : 
          String(item)
        );
      } else {
        improvements = [];
      }
      
      // Ensure strengths array only contains strings
      let strengths = parsed.strengths || [];
      if (Array.isArray(strengths)) {
        strengths = strengths.map(item => 
          typeof item === 'string' ? item : 
          typeof item === 'object' ? (item.suggestion || item.area || item.skill || JSON.stringify(item)) : 
          String(item)
        );
      } else {
        strengths = [];
      }
      
      const result = {
        score: parsed.fitScore || parsed.score || 75,
        justification: parsed.justification || 'Role fit analysis based on skills and experience',
        strengths: strengths,
        improvements: improvements,
      };
      
      console.log('CareerFitAgent: Returning result:', result);
      return result;
      
    } catch (error) {
      console.error('CareerFitAgent: Error calculating role fit:', error);
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

export const careerFitAgent = new CareerFitAgent();