import { groqService } from '../groq';

export class JobFetcherAgent {
  async fetchJobs(resumeData: any, jobRole: string): Promise<any> {
    try {
      console.log('JobFetcherAgent: Fetching jobs for role:', jobRole);
      
// The profile and prompt are no longer needed as we're using the fetchJobMatches method from groqService

      // Use the fetchJobMatches method from groqService which handles rate limiting
      const profileSummary = this.createProfileSummary(resumeData, jobRole);
      const result = await groqService.fetchJobMatches(profileSummary, jobRole, 'remote');
      console.log('JobFetcherAgent: Raw job suggestions:', result);
      
      const cleanedResponse = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResponse);
      
      return {
        searchQuery: parsed.searchQuery || `${jobRole} entry level`,
        jobSuggestions: Array.isArray(parsed.jobSuggestions) ? parsed.jobSuggestions : []
      };
      
    } catch (error) {
      console.error('JobFetcherAgent: Error fetching jobs:', error);
      throw error;
    }
  }

  private createProfileSummary(resumeData: any, jobRole: string): string {
    const skills = resumeData.skills?.slice(0, 5).join(', ') || 'Various technical skills';
    const experience = resumeData.experience?.length > 0 ? 
      `${resumeData.experience.length} work experience(s)` : 'Entry level';
    const education = resumeData.education?.[0]?.degree || 'Relevant education';
    
    return `Looking for ${jobRole} roles. Skilled in ${skills}. ${experience}. ${education}.`;
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

export const jobFetcherAgent = new JobFetcherAgent();