import { GroqService } from './groq';
import { dataAgent } from './agents/DataAgent';
import { scraperAgent } from './agents/ScraperAgent';

type AgentResult = {
  success: boolean;
  data: any;
  error?: string;
};

class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private groqService: GroqService;
  private results: Record<string, AgentResult> = {};

  private constructor() {
    this.groqService = new GroqService();
  }

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  async processResume(
    fileContent: string,
    fileType: string = 'text',
    targetRole: string = 'Software Engineer',
    location: string = 'Remote'
  ): Promise<Record<string, any>> {
    try {
      // 1. Scraper Agent - Extract text content from resume
      console.log('Starting Scraper Agent...');
      // Create a mock File object for the ScraperAgent
      const isBase64 = fileType.includes('image') || fileType === 'application/pdf';
      const mockFile = {
        name: 'resume',
        type: fileType,
        text: () => Promise.resolve(fileContent),
        arrayBuffer: async () => {
          // Convert base64 to ArrayBuffer if needed
          if (isBase64) {
            const base64Data = fileContent.split(',')[1] || fileContent;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
          }
          // For text files, convert string to ArrayBuffer
          const encoder = new TextEncoder();
          return encoder.encode(fileContent).buffer;
        },
        isMockFile: true,
        content: isBase64 ? '' : fileContent,
        base64Data: isBase64 ? fileContent.split(',')[1] || fileContent : ''
      } as unknown as File;
      
      // Extract text content using ScraperAgent
      const extractedText = await scraperAgent.extractTextContent(mockFile);
      
      // 2. Data Agent - Process extracted text data
      console.log('Starting Data Agent...');
      const resumeData = await dataAgent.extractResumeData(extractedText);

      // 2. Skill Analyzer - Extract skills
      console.log('Starting Skill Analyzer...');
      const skills = await this.executeWithRetry(
        () => this.groqService.analyzeSkillProficiency(JSON.stringify(resumeData)),
        'skillAnalyzer'
      );

      // 3. Career Fit - Match to target role
      console.log('Starting Career Fit Agent...');
      const careerFit = await this.executeWithRetry(
        () => this.groqService.assessCareerFit(JSON.stringify(resumeData), targetRole),
        'careerFit'
      );

      // 4. Personality Analysis
      console.log('Starting Personality Agent...');
      const personality = await this.executeWithRetry(
        () => this.groqService.analyzePersonality(JSON.stringify(resumeData)),
        'personality'
      );

      // 5. Get Recommendations
      console.log('Starting Recommendation Agent...');
      const recommendations = await this.executeWithRetry(
        () => this.groqService.generateRecommendations(JSON.stringify(resumeData), targetRole, location),
        'recommendations'
      );

      // 6. Fetch Job Suggestions
      console.log('Starting Job Fetcher Agent...');
      const jobSuggestions = await this.executeWithRetry(
        () => this.groqService.fetchJobMatches(JSON.stringify(resumeData), targetRole, location),
        'jobSuggestions'
      );

      // 7. Generate Final Feedback
      console.log('Starting Feedback Agent...');
      const allResults = {
        resumeData: resumeData,
        skills: JSON.parse(skills),
        careerFit: JSON.parse(careerFit),
        personality: JSON.parse(personality),
        recommendations: JSON.parse(recommendations),
        jobSuggestions: JSON.parse(jobSuggestions)
      };

      const feedback = await this.executeWithRetry(
        () => this.groqService.generateFeedback(JSON.stringify(resumeData), allResults),
        'feedback'
      );

      // Return all results
      return {
        ...allResults,
        feedback: JSON.parse(feedback)
      };
    } catch (error) {
      console.error('Error in AgentOrchestrator:', error);
      throw error;
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    agentName: string,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        this.results[agentName] = { success: true, data: result };
        return String(result);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed for ${agentName}:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    this.results[agentName] = { 
      success: false, 
      data: null, 
      error: lastError?.message || 'Unknown error' 
    };
    
    throw lastError || new Error(`Failed to execute ${agentName} after ${maxRetries} attempts`);
  }

  getAgentResults(): Record<string, AgentResult> {
    return { ...this.results };
  }
}

// Export the singleton instance
export const agentOrchestrator = AgentOrchestrator.getInstance();

export default AgentOrchestrator;
