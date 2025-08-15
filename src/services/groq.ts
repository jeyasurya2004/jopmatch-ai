import { Groq } from 'groq-sdk';
import { AGENT_KEYS } from '../config/agentConfig';

// Agent types for type safety
type AgentType = keyof typeof AGENT_KEYS;

// Type definitions for Groq API responses
interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint: string;
}

// Import Groq SDK types
import { ChatCompletionContentPartText, ChatCompletionContentPartImage } from 'groq-sdk/resources/chat/completions';

// Define message types for Groq chat completions
interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | Array<ChatCompletionContentPartText | ChatCompletionContentPartImage>;
  name?: string;
}

// Track rate limit state
interface RateLimitState {
  remaining: number;
  resetAt: number;
  queue: Array<() => Promise<void>>;
  processing: boolean;
}

// Global rate limit state
const rateLimits = new Map<string, RateLimitState>();

// Get or create rate limit state for a model
function getRateLimitState(model: string): RateLimitState {
  if (!rateLimits.has(model)) {
    rateLimits.set(model, {
      remaining: 5, // Start more conservatively
      resetAt: 0,
      queue: [],
      processing: false
    });
  }
  return rateLimits.get(model)!;
}

// Process the queue for a model
async function processQueue(model: string) {
  const state = getRateLimitState(model);
  if (state.processing || state.queue.length === 0) return;

  state.processing = true;
  
  try {
    while (state.queue.length > 0) {
      // Check rate limits
      const now = Date.now();
      if (now < state.resetAt && state.remaining <= 0) {
        // Wait until rate limit resets
        const waitTime = state.resetAt - now + 1000;
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime/1000)}s before processing next request.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Process the next request
      const request = state.queue.shift()!;
      await request();
      
      // Update rate limit state
      state.remaining = Math.max(0, state.remaining - 1);
      
      // Add a small delay between requests to avoid hitting rate limits
      if (state.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } finally {
    state.processing = false;
  }
}

export class GroqService {
  // Parse retry-after header or use default delay
  private parseRetryAfter(header: string | null): number {
    if (!header) return 5000; // Default 5 seconds
    
    // If it's a number of seconds
    if (/^\d+$/.test(header)) {
      return parseInt(header, 10) * 1000; // Convert to milliseconds
    }
    
    // If it's an HTTP date
    const date = new Date(header);
    if (!isNaN(date.getTime())) {
      return date.getTime() - Date.now();
    }
    
    return 5000; // Default 5 seconds
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(attempt: number, initialDelay: number): number {
    const baseDelay = initialDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.5 * baseDelay; // Add up to 50% jitter
    return Math.min(baseDelay + jitter, 60000); // Cap at 60 seconds
  }

  private async makeRequest(
    apiKey: string,
    model: string,
    messages: GroqMessage[],
    temperature: number = 0.7,
    maxTokens: number = 2048,
    requireJson: boolean = true,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<string> {
    const state = getRateLimitState(model);
    const groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true // Only for development
    });

    const executeRequest = async (attempt = 0): Promise<string> => {
      try {
        // Create a deep copy of messages to avoid mutating the original
        const requestMessages: GroqMessage[] = JSON.parse(JSON.stringify(messages));
        
        // Add JSON instruction to the first system message if requireJson is true
        if (requireJson && requestMessages.length > 0 && requestMessages[0].role === 'system') {
          const firstMessage = requestMessages[0];
          if (firstMessage.role === 'system') {
            requestMessages[0] = {
              ...firstMessage,
              content: Array.isArray(firstMessage.content) 
                ? [
                    { type: 'text', text: firstMessage.content.filter(c => c.type === 'text').map(c => (c as {type: 'text'; text: string}).text).join('\n') },
                    ...firstMessage.content.filter(c => c.type !== 'text')
                  ]
                : `${firstMessage.content} Always respond with a valid JSON object.`
            };
          }
        }

        // Add token usage optimization for longer conversations
        const optimizedMessages = requestMessages.map(msg => {
          // Handle both string and ContentPart[] content
          const optimizedContent = typeof msg.content === 'string' 
            ? msg.content.substring(0, 8000) // Limit string content length
            : msg.content.map(part => {
                if (part.type === 'text') {
                  return {
                    ...part,
                    text: part.text.substring(0, 8000) // Limit text content length
                  };
                }
                return part; // Keep image content as is
              });

          return {
            ...msg,
            content: optimizedContent
          };
        });

        // Convert messages to Groq SDK's expected format
        const groqMessages = optimizedMessages.map(msg => {
          // Handle function role separately as it requires content to be string | null
          if (msg.role === 'function') {
            return {
              role: 'function' as const,
              content: typeof msg.content === 'string' ? msg.content : null,
              name: msg.name || ''
            };
          }
          
          // Handle both string and multimodal content for other roles
          let content: string | Array<ChatCompletionContentPartText> | Array<ChatCompletionContentPartImage>;
          if (typeof msg.content === 'string') {
            // For text content, add JSON instruction if required
            content = msg.content + (requireJson && msg.role === 'system' ? ' Always respond with a valid JSON object.' : '');
          } else {
            // For multimodal content, we need to ensure arrays are of a single type
            // Check if all elements are text or all are images
            const hasText = msg.content.some(part => 'text' in part);
            const hasImage = msg.content.some(part => 'image_url' in part);
            
            if (hasText && !hasImage) {
              // All text parts
              content = msg.content.map(part => ({
                type: 'text',
                text: (part as ChatCompletionContentPartText).text
              }));
            } else if (hasImage && !hasText) {
              // All image parts
              content = msg.content.map(part => ({
                type: 'image_url',
                image_url: (part as ChatCompletionContentPartImage).image_url
              }));
            } else if (hasText && hasImage) {
              // Mixed content - this is complex, for now we'll just send the text parts
              // In a real implementation, we might want to handle this differently
              content = msg.content
                .filter(part => 'text' in part)
                .map(part => ({
                  type: 'text',
                  text: (part as ChatCompletionContentPartText).text
                }));
            } else {
              // Empty array, treat as empty text
              content = '';
            }
          }

          // Create appropriate message type based on role
          switch (msg.role) {
            case 'system':
              return {
                role: 'system' as const,
                content: typeof content === 'string' || Array.isArray(content) && content.every(c => c.type === 'text') 
                  ? content as string | Array<ChatCompletionContentPartText>
                  : ''
              };
            case 'user':
              return {
                role: 'user' as const,
                content
              };
            case 'assistant':
              return {
                role: 'assistant' as const,
                content: typeof content === 'string' || Array.isArray(content) && content.every(c => c.type === 'text') 
                  ? content as string | Array<ChatCompletionContentPartText>
                  : ''
              };
            default:
              // For any other role, cast to user (this should not happen with proper typing)
              return {
                role: 'user' as const,
                content
              };
          }
        });

        const completion = await groq.chat.completions.create({
          model,
          messages: groqMessages,
          temperature,
          max_tokens: Math.min(maxTokens, 4000), // Cap max tokens
          response_format: requireJson ? { type: 'json_object' } : undefined
        }, {
          maxRetries: 3, // Retry on network errors
          timeout: 30000, // 30 second timeout
        }) as unknown as ChatCompletion;

        // Update rate limit state based on response headers if available
        const headers = (completion as any).headers || {};
        if (headers['x-ratelimit-remaining']) {
          state.remaining = parseInt(headers['x-ratelimit-remaining'], 10);
        } else {
          state.remaining = state.remaining > 0 ? state.remaining - 1 : 0;
        }
        
        if (headers['x-ratelimit-reset']) {
          state.resetAt = parseInt(headers['x-ratelimit-reset'], 10) * 1000; // Convert to milliseconds
        }

        // Return the completion content
        let response = completion.choices[0]?.message?.content || '{}';
        
        // If JSON is required, clean and validate the response
        if (requireJson) {
          try {
            // Clean the response string before parsing
            try {
              // First, try to parse the response as-is (it might be valid JSON already)
              return JSON.stringify(JSON.parse(response));
            } catch (initialError) {
              // If initial parse fails, try to clean and fix the JSON
              try {
                // Remove any code block markers if present
                response = response
                  .replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1') // Remove ```json ``` markers
                  .replace(/^[^{\[]*([{\[])/, '$1') // Remove anything before first { or [
                  .replace(/([}\]])[^\]]*$/, '$1'); // Remove anything after last } or ]

                // Remove control characters that can cause JSON parsing to fail
                response = response.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

                // Try to parse the cleaned response
                return JSON.stringify(JSON.parse(response));
              } catch (cleaningError) {
                // If still failing, try more aggressive cleaning
                try {
                  // Extract JSON-like content between curly braces
                  const jsonMatch = response.match(/\{.*\}/s);
                  if (jsonMatch) {
                    const cleanedJson = jsonMatch[0]
                      // Fix common JSON issues
                      .replace(/\n/g, ' ') // Replace newlines with spaces
                      .replace(/\s+/g, ' ') // Collapse multiple spaces
                      // Fix unquoted property names
                      .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":')
                      // Fix single quotes to double quotes
                      .replace(/:\s*'([^']*?)'\s*([,\}])/g, ':"$1"$2')
                      // Fix trailing commas
                      .replace(/,\s*([}\]])/g, '$1')
                      // Fix missing quotes around values
                      .replace(/:\s*([^\s\{\}\[\],"'0-9][^\s\{\}\[\],:]*)([,\}])/g, ':"$1"$2');

                    return JSON.stringify(JSON.parse(cleanedJson));
                  }
                  throw cleaningError;
                } catch (finalError) {
                  console.error('Failed to clean and parse JSON after multiple attempts:', finalError);
                  console.error('Original response:', response);
                  throw new Error('Failed to parse JSON response after multiple cleaning attempts');
                }
              }
            }

            // Try to parse the cleaned JSON
            const parsed = JSON.parse(response);
            return JSON.stringify(parsed); // Return re-serialized JSON for consistency
          } catch (e) {
            console.error('Failed to parse JSON response. Error:', e);
            console.error('Original response:', response);
            throw new Error(`Invalid JSON response from model: ${response}`);
          }
        }
        return response;
      } catch (error: any) {
        // Handle rate limiting with better error parsing
        if (error.status === 429) {
          // Parse the error response for detailed rate limit info
          let errorMessage = 'Rate limit exceeded';
          let retryAfter = 0;
          
          try {
            const errorResponse = typeof error.error === 'string' 
              ? JSON.parse(error.error) 
              : error.error || {};
            
            errorMessage = errorResponse.error?.message || errorMessage;
            retryAfter = this.parseRetryAfter(error.response?.headers?.['retry-after']);
            
            // Extract retry time from error message if available
            const retryMatch = errorMessage.match(/try again in (\d+\.?\d*)s/);
            if (retryMatch) {
              retryAfter = Math.max(retryAfter, parseFloat(retryMatch[1]) * 1000);
            }
          } catch (e) {
            console.error('Error parsing rate limit error:', e);
          }
          
          // If we've exhausted all retries, throw an error
          if (attempt >= maxRetries) {
            throw new Error(`Rate limit exceeded: ${errorMessage}. Please try again later.`);
          }
          
          const delay = retryAfter > 0 
            ? retryAfter 
            : this.calculateDelay(attempt, initialDelay);
            
          console.warn(`Rate limited. Retrying in ${Math.ceil(delay/1000)}s (attempt ${attempt + 1}/${maxRetries})\nReason: ${errorMessage}`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        } 
        // For other errors, retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.warn(`Request failed (${error.message}). Retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        }
        
        console.error('Groq API request failed after retries:', error);
        throw error;
      }
    };

    // Queue the request and process the queue
    return new Promise((resolve, reject) => {
      state.queue.push(async () => {
        try {
          const result = await executeRequest();
          resolve(result);
        } catch (error) {
          // If we have retries left, retry the request
          if (maxRetries > 0) {
            console.warn(`Retrying... (${maxRetries} attempts remaining)`);
            try {
              const result = await this.makeRequest(
                apiKey, 
                model, 
                messages, 
                temperature, 
                maxTokens, 
                requireJson, 
                maxRetries - 1, 
                initialDelay * 2
              );
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        } finally {
          // Process next item in queue
          state.processing = false;
          if (state.queue.length > 0) {
            processQueue(model);
          }
        }
      });
      
      // Process the queue if not already processing
      if (!state.processing) {
        processQueue(model);
      }
    });
  }

  // Model configurations for different agents
  private modelConfigs: Record<AgentType, { model: string; maxTokens: number }> = {
    // Data extraction - uses a fast, efficient model for parsing resumes
    DATA_AGENT: { model: 'llama-3.1-8b-instant', maxTokens: 3048 },
    
    // Skill analysis - uses a high-capability model for detailed analysis
    SKILL_ANALYZER: { model: 'openai/gpt-oss-20b', maxTokens: 4096 },
    
    // Career fit analysis - uses a high-capability model for nuanced analysis
    CAREER_FIT: { model: 'llama3-70b-8192', maxTokens: 3048 },
    
    // Personality analysis - uses a specialized model for behavioral analysis
    PERSONALITY: { model: 'gemma2-9b-it', maxTokens: 4096 },
    
    // Recommendation generation - uses a high-capability model for creative suggestions
    RECOMMENDATION: { model: 'meta-llama/llama-4-scout-17b-16e-instruct', maxTokens: 4096 },
    
    // Job fetching - uses a specialized model for search and matching
    JOB_FETCHER: { model: 'gemma2-9b-it', maxTokens: 4096 },
    
    // Feedback generation - uses a high-capability model for comprehensive feedback
    FEEDBACK: { model: 'meta-llama/llama-4-scout-17b-16e-instruct', maxTokens: 4096 },
  };

  // Helper method to get the appropriate API key and model for an agent
  private getAgentConfig(agentType: AgentType) {
    const apiKey = AGENT_KEYS[agentType];
    if (!apiKey) {
      console.error(`${agentType} API key is not set in environment variables`);
      throw new Error(`${agentType} API key not configured`);
    }
    
    const config = this.modelConfigs[agentType];
    
    return {
      apiKey,
      model: config.model,
      maxTokens: config.maxTokens
    };
  }

  // Data Agent - Extract resume data
  async extractResumeData(fileContent: string, fileType: string = 'text', isBase64: boolean = false): Promise<string> {
    try {
      // Truncate content if it's too long (only for text content)
      let truncatedContent = fileContent;
      if (!isBase64) {
        const maxTokens = 120000; // 150K tokens is roughly 120K characters
        truncatedContent = fileContent.length > maxTokens 
          ? fileContent.substring(0, maxTokens) 
          : fileContent;
      }

      const systemPrompt = `You are an expert at extracting and structuring information from resumes. 

Extract ALL information from the resume with high accuracy. Pay special attention to:
1. Contact Information: name, email, phone, location, LinkedIn/GitHub profiles
2. Work Experience: company names, job titles, dates, responsibilities, achievements with metrics
3. Education: degrees, institutions, graduation dates, GPAs
4. Skills: technical skills, tools, programming languages with proficiency levels
5. Projects: project names, descriptions, technologies used, your role
6. Certifications: names, issuing organizations, dates
7. Languages: languages and proficiency levels
8. Summary/Objective: professional summary or career objective

IMPORTANT INSTRUCTIONS:
- Extract dates in ISO format (YYYY-MM-DD)
- For skills, include proficiency levels (Beginner, Intermediate, Advanced, Expert) when possible
- For work experience, extract quantifiable achievements (e.g., "Increased X by Y%")
- If any field is not present, set it to an empty array/string
- Return a valid JSON object with all fields, even if empty`;

      const jsonExample = JSON.stringify({
        contact: {
          name: "Full Name",
          email: "email@example.com",
          phone: "+1234567890",
          location: "City, Country",
          linkedin: "linkedin.com/in/username",
          github: "github.com/username"
        },
        summary: "Professional summary or objective",
        workExperience: [
          {
            company: "Company Name",
            position: "Job Title",
            startDate: "YYYY-MM-DD",
            endDate: "YYYY-MM-DD or Present",
            location: "City, Country",
            responsibilities: ["Responsibility 1", "Responsibility 2"],
            achievements: ["Achievement 1 with metrics if possible"]
          }
        ],
        education: [
          {
            institution: "University Name",
            degree: "Degree Name",
            fieldOfStudy: "Field of Study",
            startDate: "YYYY-MM-DD",
            endDate: "YYYY-MM-DD or Present",
            gpa: "X.XX/4.00",
            honors: ["Honor 1", "Honor 2"]
          }
        ],
        skills: [
          {
            name: "Skill Name",
            category: "Category (e.g., Programming, Tools)",
            proficiency: "Beginner/Intermediate/Advanced/Expert"
          }
        ],
        projects: [
          {
            name: "Project Name",
            description: "Brief description",
            technologies: ["Tech 1", "Tech 2"],
            role: "Your role in the project",
            outcomes: ["Key outcome or achievement"]
          }
        ],
        certifications: [
          {
            name: "Certification Name",
            issuer: "Issuing Organization",
            date: "YYYY-MM-DD",
            credentialUrl: "URL to credential (if available)"
          }
        ],
        languages: [
          {
            name: "Language Name",
            proficiency: "Native/Bilingual/Proficient/Intermediate/Beginner"
          }
        ]
      }, null, 2);

      // Use the Data Agent's API key and model
      const { apiKey, model } = this.getAgentConfig('DATA_AGENT');
      
      let messages: GroqMessage[];
      
      if (isBase64 && (fileType.includes('image') || fileType === 'application/pdf')) {
        // For images and PDFs, send as multimodal input
        messages = [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all information from this resume in a structured JSON format. The response must be a valid JSON object with the following structure:

${jsonExample}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${truncatedContent}`
                }
              }
            ]
          }
        ];
      } else {
        // For text files, send as text input
        const userPrompt = `Extract all information from this resume in a structured JSON format. The response must be a valid JSON object with the following structure:

${jsonExample}

Resume text: ${truncatedContent}`;
        
        messages = [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ];
      }

      // Make the API request
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.3, // Lower temperature for more consistent results
        3048, // Max tokens
        true // Require JSON response
      );

      return response;
    } catch (error) {
      console.error('Error extracting resume data:', error);
      throw error;
    }
  }

  // Analyzes the role fit based on resume data and job role
  async analyzeRoleFit(resumeData: string, jobRole: string): Promise<string> {
    try {
      // Parse the resume data if it's a string
      const parsedResumeData = typeof resumeData === 'string' ? JSON.parse(resumeData) : resumeData;
      
      const prompt = `You are an expert career advisor. Analyze how well the candidate's skills and experience match the ${jobRole} role.

Resume Data:
${JSON.stringify(parsedResumeData, null, 2)}

Return a JSON object with the following structure:
{
  "fitScore": number (0-100),
  "justification": "detailed explanation of the fit score",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific area for improvement 1", "specific area for improvement 2"]
}

IMPORTANT: 
- Only include the JSON object in your response
- Do not include any text before or after the JSON object
- Ensure all strings are properly escaped
- Make sure improvements are actionable and specific`;

      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes role fit for candidates and returns structured JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use the Career Fit's API key and model
      const { apiKey, model } = this.getAgentConfig('CAREER_FIT');
      
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.3,
        3048,
        true
      );

      return response;
    } catch (error) {
      console.error('Error analyzing role fit:', error);
      throw error;
    }
  }

  // Analyzes the skills in the resume and returns a structured analysis
  async analyzeSkillProficiency(resumeData: string): Promise<string> {
    try {
      // Parse the resume data if it's a string
      const parsedResumeData = typeof resumeData === 'string' ? JSON.parse(resumeData) : resumeData;
      
      const prompt = `You are an expert at analyzing skills in resumes. Analyze the following resume data and provide a structured analysis of the candidate's skills.

Resume Data:
${JSON.stringify(parsedResumeData, null, 2)}

Return a JSON object with the following structure:
{
  "hardSkills": [
    {
      "skill": "skill_name",
      "proficiency": "beginner|intermediate|expert",
      "category": "category_name",
      "yearsOfExperience": number
    }
  ],
  "softSkills": [
    {
      "skill": "skill_name",
      "proficiency": "beginner|intermediate|expert"
    }
  ],
  "certifications": [
    {
      "name": "certification_name",
      "issuer": "organization_name",
      "date": "date_earned"
    }
  ],
  "languages": [
    {
      "language": "language_name",
      "proficiency": "beginner|intermediate|advanced|fluent|native"
    }
  ]
}

IMPORTANT: 
- Only include the JSON object in your response
- Do not include any text before or after the JSON object
- Ensure all strings are properly escaped
- Ensure the JSON is properly formatted with no trailing commas or syntax errors
- Do not include any markdown formatting or code block markers`;

      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes skills in resumes and returns structured JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use the Skill Analyzer's API key and model
      const { apiKey, model } = this.getAgentConfig('SKILL_ANALYZER');
      
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.3,
        4096,
        true
      );

      return response;
    } catch (error) {
      console.error('Error in analyzeSkillProficiency:', error);
      throw error;
    }
  }

  // Analyzes career fit for a candidate
  async assessCareerFit(resumeData: string, targetRole: string): Promise<string> {
    try {
      // Parse the resume data if it's a string
      const parsedResumeData = typeof resumeData === 'string' ? JSON.parse(resumeData) : resumeData;
      
      const prompt = `You are an expert career advisor. Assess how well a candidate's resume fits a specific job role.

Target Role: ${targetRole}

Candidate Resume Data:
${JSON.stringify(parsedResumeData, null, 2)}

Return a JSON object with the following structure:
{
  "compatibilityScore": 0-100,
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "recommendations": ["string"],
  "overallAnalysis": "string"
}

IMPORTANT: 
- Only include the JSON object in your response
- Do not include any text before or after the JSON object
- Ensure all strings are properly escaped
- Ensure the JSON is properly formatted with no trailing commas or syntax errors
- Do not include any markdown formatting or code block markers`;

      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes career fit and returns structured JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use the Career Fit's API key and model
      const { apiKey, model } = this.getAgentConfig('CAREER_FIT');
      
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.3,
        3048,
        true
      );

      return response;
    } catch (error) {
      console.error('Error in assessCareerFit:', error);
      // Return a default response in case of error
      return JSON.stringify({
        role: targetRole,
        fitScore: 0,
        strengths: [],
        areasForImprovement: ['Unable to assess career fit at this time.'],
        summary: `Career fit assessment for ${targetRole} could not be completed.`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        matchedSkills: [],
        missingSkills: []
      });
    }
  }

  
  async analyzePersonality(resumeData: string): Promise<string> {
    try {
      const { apiKey, model } = this.getAgentConfig('PERSONALITY');
      
      const prompt = `
      You are an expert HR analyst and psychologist. Your task is to infer a "Big Five" personality profile from a candidate's resume data.

      **Candidate's Resume Data (JSON):**
      ${resumeData}

      **CRITICAL INSTRUCTIONS:**
      1.  **Analyze the Resume:** Infer the candidate's personality traits from their experience, project descriptions, and self-summary.
      2.  **Provide Scores:** For each of the five personality traits (openness, conscientiousness, extraversion, agreeableness, neuroticism), provide a numerical score between 0.0 and 1.0.
      3.  **Write a Summary:** You MUST write a concise, 2-3 sentence analysis of the candidate's likely work style in the "summary" field.
      4.  **Fill ALL Fields:** Do not leave any fields empty. All six fields in the JSON response are mandatory.
      5.  **Strict JSON Only:** Your entire response must be a single, valid JSON object and nothing else.

      **Required JSON Output Structure:**
      {
        "openness": 0.0,
        "conscientiousness": 0.0,
        "extraversion": 0.0,
        "agreeableness": 0.0,
        "neuroticism": 0.0,
        "summary": "A 2-3 sentence summary of the candidate's work style based on the analysis."
      }
      `;

      const messages: GroqMessage[] = [
        { 
          role: 'system', 
          content: 'You are an expert HR analyst who provides personality profiles in a strict JSON format. You must provide scores for all five traits and include a summary.'
        },
        { 
          role: 'user', 
          content: prompt
        }
      ];

      const response = await this.makeRequest(apiKey, model, messages, 0.4, 2048, true);
      return response;

    } catch (error) {
      console.error('Error in analyzePersonality:', error);
      // Return a structured error response
      return JSON.stringify({
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
        summary: "Could not generate personality profile at this time due to an AI service error."
      });
    }
  }


  async generateRecommendations(resumeData: string, targetRole: string, skillGaps: string, searchContext: string): Promise<string> {
    try {
      const { apiKey, model } = this.getAgentConfig('RECOMMENDATION');
      
      const prompt = `
      You are an expert Learning Path Advisor. Your task is to analyze a list of raw search results and create a structured, high-quality learning plan.

      **Input Data:**
      1.  **Candidate's Target Role:** ${targetRole}
      2.  **Identified Skill Gaps:** ${skillGaps}
      3.  **Candidate's Resume Data (JSON):**
          ${resumeData}
      4.  **Raw Learning Resource Search Results (includes articles, tutorials, and YouTube videos):**
          ---
          ${searchContext}
          ---

      **CRITICAL INSTRUCTIONS:**
      1.  **Analyze and Select:** From the search results, select the **top 5-7 most relevant and high-quality** learning resources that address the skill gaps, keeping the candidate's resume in mind.
      2.  **Ensure Variety:** Include a good mix of content types (e.g., official documentation, in-depth articles, and YouTube tutorials).
      3.  **Fill ALL Fields:** For every single learning path suggestion, you MUST provide a value for all fields: "title", "skillCovered", "description", "provider", and "link". Do not leave any field empty.
      4.  **Be Specific:** For the "provider", name the specific website or YouTube channel (e.g., "freeCodeCamp", "Traversy Media", "Official React Docs").
      5.  **Strict JSON Only:** Your entire response must be a single, valid JSON object and nothing else.
      
      **CRITICAL REMINDER:** The final output MUST start with \`{"learningPathSuggestions": [\` and be a single, complete JSON object.

      **Required JSON Output Structure:**
      {
        "learningPathSuggestions": [
          {
            "title": "Example Title",
            "skillCovered": "Example Skill",
            "description": "Example description.",
            "provider": "Example Provider",
            "link": "https://example.com"
          }
        ],
        "summary": "A concise, encouraging summary of the recommended learning plan."
      }
      `;

      const messages: GroqMessage[] = [
        { 
          role: 'system', 
          content: 'You are an expert career counselor who creates structured learning paths from search results. You must return a single, valid JSON object with all fields completed for every item.'
        },
        { 
          role: 'user', 
          content: prompt
        }
      ];

      const response = await this.makeRequest(apiKey, model, messages, 0.6, 4048, true, 3, 1000);
      return response;

    } catch (error) {
      console.error('Error generating recommendation suggestions with LLM:', error);
      return JSON.stringify({
        learningPathSuggestions: [],
        summary: "Could not generate learning recommendations at this time due to an AI service error."
      });
    }
  }




  async generateFeedback(resumeData: string, allResults: any): Promise<string> {
    try {
      // Get the API key and model for the feedback agent
      const { apiKey, model } = this.getAgentConfig('FEEDBACK');
      
      // Prepare the prompt with resume data and analysis results
      const prompt = `
      You are a highly specialized feedback generation bot. Your sole purpose is to generate a single, valid JSON object containing a comprehensive and actionable feedback report.

      **CRITICAL INSTRUCTIONS:**
      1.  **Analyze the Input:** Use the provided resume data and analysis results to generate your feedback.
      2.  **Strict JSON Format:** Your entire response MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON.
      3.  **Mandatory Fields:** The JSON object MUST include all of the following fields: \`summary\`, \`strengths\`, \`areasForImprovement\`, \`keyRecommendations\`, \`nextSteps\`, and \`overallScore\`.
      4.  **Be Comprehensive:** Where applicable, provide at least 3-5 detailed points for each list (\`strengths\`, \`areasForImprovement\`, \`keyRecommendations\`, \`nextSteps\`).
      5.  **Self-Correction:** Before you finalize your response, review it one last time to ensure it is a valid JSON object and that all mandatory fields are present and correctly formatted.

      **Input Data:**
      *   **Resume Summary:**
          ${resumeData}
      *   **Analysis Results:**
          ${JSON.stringify(allResults, null, 2)}
      
      **Perfect JSON Output Example:**
      {
        "summary": "The candidate has a strong foundation in machine learning and AI. To pivot to a backend development role, the key is to build and showcase experience with relevant backend technologies and frameworks. The current resume is AI-focused and needs to be tailored to highlight transferable skills and new backend projects.",
        "strengths": [
          "Expert-level Python proficiency, a core skill for backend development.",
          "Intermediate SQL skills, demonstrating a foundational understanding of databases.",
          "Experience building an end-to-end application (Vision Assistant), which shows project completion ability.",
          "Proven ability to learn complex technical topics quickly, as shown by AI/ML project work."
        ],
        "areasForImprovement": [
          "Gain hands-on experience with at least one major backend framework like Django, Flask, or FastAPI.",
          "Build projects demonstrating RESTful API design, including user authentication and database modeling.",
          "Learn essential backend technologies such as Docker for containerization, PostgreSQL for databases, and Redis for caching.",
          "Develop a deeper understanding of system design principles for scalable applications."
        ],
        "keyRecommendations": [
          {
            "category": "Project Development",
            "recommendation": "Create a new GitHub project that is a full-featured REST API. It should include user registration/login, protected endpoints, and CRUD operations on a database.",
            "impact": "Provides concrete, undeniable proof of backend development skills and understanding."
          },
          {
            "category": "Resume Tailoring",
            "recommendation": "Create a dedicated 'Backend Developer' version of the resume. Replace the current summary with one focused on backend aspirations and skills. Emphasize transferable skills like Python, SQL, and problem-solving.",
            "impact": "Will make the resume pass the initial screening by recruiters looking for backend developers."
          },
          {
            "category": "Conceptual Learning",
            "recommendation": "Study system design fundamentals. Watch tutorials on designing scalable web services and read articles on microservices vs. monolithic architectures.",
            "impact": "Prepares you for technical interviews and for building robust, real-world applications."
          }
        ],
        "nextSteps": [
          "Take an online course on FastAPI or Django.",
          "Build a simple To-Do List API with user authentication.",
          "Learn the basics of Docker to containerize the new API project.",
          "Read 'Grokking the System Design Interview' or similar resources.",
          "Update your LinkedIn profile to reflect a focus on backend development and list your new projects."
        ],
        "overallScore": 65
      }
      `;
      
      // Prepare messages for the API request
      const messages: GroqMessage[] = [
        { 
          role: 'system', 
          content: 'You are an expert resume reviewer and career coach. Your only job is to return a valid JSON object with the specified mandatory fields. Do not omit any fields.'
        },
        { 
          role: 'user', 
          content: prompt
        }
      ];

      // Make the API request with JSON response format
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.5, // Lower temperature for more focused feedback
        4096, // Increased max tokens for the longer lists
        true, // require JSON response
        3, // maxRetries
        1000 // initialDelay
      );

      return response;

    } catch (error) {
      console.error('Error generating feedback:', error);
      // Return a structured fallback response with valid fields
      const fallbackResponse = {
        overallScore: 50,
        strengths: ["Could not generate feedback at this time."],
        areasForImprovement: ["There was an error in the AI service."],
        keyRecommendations: [],
        nextSteps: ["Please try running the analysis again."],
        summary: "An error occurred while generating comprehensive feedback."
      };
      return JSON.stringify(fallbackResponse);
    }
  }


  async fetchJobMatches(resumeData: string, targetRole: string, searchContext: string): Promise<string> {
    try {
      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: `You are an expert career advisor. Your task is to analyze a list of raw job search results and select the top 5-7 most relevant jobs for a candidate based on their resume. You must return a single, valid JSON object with all fields completed.`
        },
        {
          role: 'user',
          content: `
          **Candidate's Target Role:** ${targetRole}

          **Candidate's Resume Data (JSON):**
          ${resumeData}

          **Raw Job Search Results to Analyze:**
          ---
          ${searchContext}
          ---

          **CRITICAL INSTRUCTIONS:**
          1.  **Analyze and Select:** From the search results, select the **top 5-7 most relevant** job listings.
          2.  **Fill ALL Fields:** For every single job suggestion, you MUST provide a value for all fields: "title", "company", "location", "description", and "url". Do not leave any field empty. If a piece of information isn't in the snippet, make a reasonable inference (e.g., if location is missing, use "Remote").
          3.  **Be Specific:** For the "company" and "location", extract the correct names from the search results.
          4.  **Strict JSON Only:** Your entire response must be a single, valid JSON object and nothing else.

          **Required JSON Output Structure:**
          {
            "jobs": [
              {
                "title": "Extracted Job Title",
                "company": "Extracted Company Name",
                "location": "Extracted Location (or 'Remote')",
                "description": "A brief, compelling summary of the job based on the provided snippet.",
                "url": "The original URL from the search result"
              }
            ]
          }
          `
        }
      ];

      // Use the Job Fetcher's API key and model
      const { apiKey, model } = this.getAgentConfig('JOB_FETCHER');
      
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.5, // Lower temperature for more focused extraction
        4096,
        true
      );

      return response;
    } catch (error) {
      console.error('Error processing job matches with LLM:', error);
      // Provide a structured error response
      return JSON.stringify({
        jobs: [{
          title: 'Error Processing Job Suggestions',
          company: 'AI System',
          location: 'N/A',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
          url: '#'
        }]
      });
    }
  }


  // Analyzes skill gaps for a job role
  async analyzeSkillGaps(userSkills: string[], jobRole: string, requiredSkills: string[]): Promise<string> {
    try {
      // Ensure we have valid arrays
      const safeUserSkills = Array.isArray(userSkills) ? userSkills : [];
      const safeRequiredSkills = Array.isArray(requiredSkills) ? requiredSkills : [];
      
      // If no required skills are provided, generate some based on the job role
      const requiredSkillsToUse = safeRequiredSkills.length > 0 
        ? safeRequiredSkills 
        : [
            'Communication',
            'Problem Solving',
            'Teamwork'
          ];
      
      const prompt = `You are a career advisor analyzing skill gaps for a job role. 
      
Role: ${jobRole}

Student Skills:
${safeUserSkills.join('\n') || 'No specific skills listed'}

Required Skills for this role:
${requiredSkillsToUse.join('\n')}

For each required skill, provide:
1. Current proficiency level (0-100)
2. Required proficiency level (0-100)
3. Gap analysis
4. Priority level (high/medium/low)

Return ONLY a valid JSON object with this exact structure:
{
  "skillGaps": [
    {
      "skill": "string",
      "currentLevel": 0-100,
      "requiredLevel": 0-100,
      "gap": 0-100,
      "importance": 0-100,
      "priority": "high" | "medium" | "low"
    }
  ],
  "overallAnalysis": "string"
}

IMPORTANT: 
- Only include the JSON object in your response
- Do not include any text before or after the JSON object
- Ensure all strings are properly escaped`;

      const messages: GroqMessage[] = [
        { 
          role: "system", 
          content: "You are a helpful assistant that analyzes skill gaps and returns them in a structured JSON format." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ];

      // Use the Skill Analyzer's API key and model
      const { apiKey, model } = this.getAgentConfig('SKILL_ANALYZER');
      
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.3,
        4048,
        true
      );

      return response;
    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      throw error;
    }
  }
}

export const groqService = new GroqService();
