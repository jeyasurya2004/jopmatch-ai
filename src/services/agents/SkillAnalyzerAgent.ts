import { groqService } from '../groq';

export class SkillAnalyzerAgent {
  async analyzeSkills(resumeData: any): Promise<any> {
    try {
      console.log('SkillAnalyzerAgent: Analyzing skills from resume data');
      // Use groqService to make the API call with rate limiting
      const skillAnalysisResult = await groqService.analyzeSkillProficiency(JSON.stringify(resumeData));
      
      const result = skillAnalysisResult;
      console.log('SkillAnalyzerAgent: Raw analysis result:', result);
      
      // Try to parse the response
      try {
        const parsed = JSON.parse(result);
        // Validate the response structure
        if (!parsed.hardSkills || !parsed.softSkills) {
          throw new Error('Invalid response format: missing required fields');
        }
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse JSON response:', result);
        // Fallback to default structure if parsing fails
        return {
          hardSkills: [],
          softSkills: []
        };
      }
    } catch (error) {
      console.error('SkillAnalyzerAgent: Error analyzing skills:', error);
      throw error;
    }
  }

  async analyzeSkillGaps(userSkills: string[] = [], jobRole: string, requiredSkills: string[] = []): Promise<any> {
    try {
      console.log('SkillAnalyzerAgent: Analyzing skill gaps for role:', jobRole);
      
      // Ensure we have valid arrays
      const safeUserSkills = Array.isArray(userSkills) ? userSkills : [];
      const safeRequiredSkills = Array.isArray(requiredSkills) ? requiredSkills : [];
      
      // If no required skills are provided, generate some based on the job role
      const requiredSkillsToUse = safeRequiredSkills.length > 0 
        ? safeRequiredSkills 
        : [
            ...this.getDefaultSkillsForRole(jobRole),
            ...safeUserSkills.slice(0, 3) // Include some user skills as required if none provided
          ];
      
      console.log('Using required skills:', requiredSkillsToUse);
      
      // Use groqService to make the API call with rate limiting
      const result = await groqService.analyzeSkillGaps(safeUserSkills, jobRole, requiredSkillsToUse);
      console.log('SkillAnalyzerAgent: Raw skill gaps result:', result);
      
      // Try to parse the response
      try {
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        // Validate the response structure
        if (!parsed.skillGaps || !Array.isArray(parsed.skillGaps)) {
          throw new Error('Invalid response format: missing or invalid skillGaps array');
        }
        
        // Ensure all required fields are present in each skill gap
        const validatedSkillGaps = parsed.skillGaps.map((gap: any) => ({
          skill: gap.skill || 'Unknown Skill',
          currentLevel: Number(gap.currentLevel) || 0,
          requiredLevel: Number(gap.requiredLevel) || 0,
          gap: Number(gap.gap) || 0,
          importance: Number(gap.importance) || 0,
          priority: ['high', 'medium', 'low'].includes(gap.priority?.toLowerCase()) 
            ? gap.priority.toLowerCase() 
            : 'medium'
        }));
        
        return {
          skillGaps: validatedSkillGaps,
          overallAnalysis: parsed.overallAnalysis || 'No analysis available'
        };
      } catch (parseError) {
        console.error('Failed to parse skill gaps response:', result);
        // Return a safe default structure if parsing fails
        return {
          skillGaps: [],
          overallAnalysis: 'Error analyzing skill gaps. Please try again.'
        };
      }
    } catch (error) {
      console.error('SkillAnalyzerAgent: Error analyzing skill gaps:', error);
      throw error;
    }
  }

  private getDefaultSkillsForRole(role: string): string[] {
    // Default skills based on common job roles
    const roleSkills: Record<string, string[]> = {
      'frontend': ['JavaScript', 'React', 'HTML/CSS', 'TypeScript', 'Responsive Design'],
      'backend': ['Node.js', 'Python', 'API Development', 'Database Design', 'Cloud Services'],
      'fullstack': ['JavaScript', 'React', 'Node.js', 'API Development', 'Database Design'],
      'mobile': ['React Native', 'iOS/Android Development', 'Mobile UI/UX', 'REST APIs'],
      'data': ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Statistics'],
      'devops': ['Docker', 'Kubernetes', 'CI/CD', 'AWS/Azure/GCP', 'Linux']
    };
    
    return roleSkills[role.toLowerCase()] || ['Communication', 'Problem Solving', 'Teamwork'];
  }
}

export const skillAnalyzerAgent = new SkillAnalyzerAgent();