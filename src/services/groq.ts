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
    DATA_AGENT: { model: 'llama-3.1-8b-instant', maxTokens: 2048 },
    
    // Skill analysis - uses a high-capability model for detailed analysis
    SKILL_ANALYZER: { model: 'llama3-70b-8192', maxTokens: 2048 },
    
    // Career fit analysis - uses a high-capability model for nuanced analysis
    CAREER_FIT: { model: 'moonshotai/kimi-k2-instruct', maxTokens: 2048 },
    
    // Personality analysis - uses a specialized model for behavioral analysis
    PERSONALITY: { model: 'meta-llama/llama-4-scout-17b-16e-instruct', maxTokens: 2048 },
    
    // Recommendation generation - uses a high-capability model for creative suggestions
    RECOMMENDATION: { model: 'qwen/qwen3-32b', maxTokens: 2048 },
    
    // Job fetching - uses a specialized model for search and matching
    JOB_FETCHER: { model: 'gemma2-9b-it', maxTokens: 2048 },
    
    // Feedback generation - uses a high-capability model for comprehensive feedback
    FEEDBACK: { model: 'meta-llama/llama-4-scout-17b-16e-instruct', maxTokens: 2048 },
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
        4096, // Max tokens
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
        4096,
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
        4096,
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
      // Parse the resume data if it's a string
      const parsedResumeData = typeof resumeData === 'string' ? JSON.parse(resumeData) : resumeData;
      
      // Extract relevant information for personality analysis
      const profileInfo = {
        summary: parsedResumeData.summary || '',
        experience: parsedResumeData.experience || [],
        skills: parsedResumeData.skills || [],
        education: parsedResumeData.education || [],
        projects: parsedResumeData.projects || []
      };

      // Create a prompt for personality analysis
      const prompt = `Analyze the following resume information and provide a personality assessment.
      Focus on work style, communication preferences, and potential cultural fit.
      
      Resume Summary: ${profileInfo.summary}
      
      Experience: ${JSON.stringify(profileInfo.experience, null, 2)}
      
      Skills: ${profileInfo.skills.join(', ')}
      
      Education: ${JSON.stringify(profileInfo.education, null, 2)}
      
      Projects: ${JSON.stringify(profileInfo.projects, null, 2)}
      
      Return the analysis as a JSON object with the following structure:
      {
        "traits": ["trait1", "trait2", "trait3"],
        "workStyle": "description of work style",
        "communicationStyle": "description of communication style",
        "strengths": ["strength1", "strength2"],
        "potentialChallenges": ["challenge1", "challenge2"]
      }
      
      IMPORTANT: 
      - Only include the JSON object in your response
      - Do not include any text before or after the JSON object
      - Ensure all strings are properly escaped
      - Ensure the JSON is properly formatted with no trailing commas or syntax errors
      - Do not include any markdown formatting or code block markers`;

      // Get the API key and model for the personality agent
      const { apiKey, model } = this.getAgentConfig('PERSONALITY');
      
      // Prepare messages for the API request
      const messages: GroqMessage[] = [
        { role: 'system', content: 'You are an expert in personality analysis and career counseling.' },
        { role: 'user', content: prompt }
      ];
      
      // Use the Groq API to analyze personality
      const completion = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.7, // temperature
        2048, // maxTokens
        true, // require JSON response
        3, // maxRetries
        1000 // initialDelay
      );

      // Parse the response
      const personalityAnalysis = typeof completion === 'string' ? JSON.parse(completion) : completion;
      
      // Return the analysis as a JSON string
      return JSON.stringify({
        ...personalityAnalysis,
        timestamp: new Date().toISOString(),
        source: 'Groq Personality Analysis'
      });
      
    } catch (error) {
      console.error('Error in analyzePersonality:', error);
      
      // Return a default response in case of error
      return JSON.stringify({
        traits: ['Analytical', 'Detail-oriented', 'Results-driven'],
        workStyle: 'Structured and methodical approach to tasks',
        communicationStyle: 'Clear and concise communication style',
        strengths: ['Problem-solving', 'Analytical thinking'],
        potentialChallenges: ['May need to adapt to highly collaborative environments'],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'Groq Personality Analysis (Fallback)'
      });
    }
  }

  async generateRecommendations(resumeData: string, targetRole: string, skillGaps: string): Promise<string> {
    try {
      // Get the API key and model for the recommendation agent
      const { apiKey, model } = this.getAgentConfig('RECOMMENDATION');
      
      // Prepare the prompt with resume data, target role, and skill gaps
      const prompt = `Based on the following resume data and identified skill gaps, provide personalized career recommendations:

Resume Summary:
${resumeData}

Target Role: ${targetRole}

Identified Skill Gaps:
${skillGaps}

Please provide recommendations in the following JSON format:
{
  "careerPath": {
    "shortTerm": ["suggestion1", "suggestedRole1"],
    "midTerm": ["suggestion2", "suggestedRole2"],
    "longTerm": ["suggestion3", "suggestedRole3"]
  },
  "skillDevelopment": [
    {
      "skill": "Python",
      "resources": ["Advanced Python Programming (Coursera)", "Real Python"],
      "timeframe": "2 months"
    }
  ],
  "certifications": [
    {
      "name": "Google Data Analytics Professional Certificate",
      "issuer": "Coursera",
      "relevance": "Builds foundational data analysis and SQL skills critical for data science"
    },
    {
      "name": "Microsoft Certified: Azure Data Scientist Associate",
      "issuer": "Microsoft",
      "relevance": "Validates expertise in cloud-based data science workflows and machine learning"
    },
    {
      "name": "SAS Certified Specialist: Statistics Using SAS",
      "issuer": "SAS",
      "relevance": "Strengthens statistical analysis capabilities for advanced data science applications"
    }
  ],
  "networking": [
    "Join local Data Science Meetup groups and participate in Kaggle competitions for industry exposure",
    "Connect with data science professionals on LinkedIn and engage with AI/ML communities like r/MachineLearning"
  ],
  "summary": "Prioritize SQL and statistical mastery while leveraging existing ML/AI expertise. Build cloud/data engineering capabilities for long-term scalability. Validate skills through industry-recognized certifications while actively engaging with data science communities to accelerate career progression."
}

IMPORTANT: Only return the JSON object. Do not include any other text, explanations, or markdown formatting. Ensure the JSON is properly formatted with no trailing commas or syntax errors.`;

      // Prepare messages for the API request
      const messages: GroqMessage[] = [
        { 
          role: 'system', 
          content: 'You are an expert career counselor and professional development advisor. Provide detailed, actionable recommendations for career growth and skill development.'
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
        0.7, // temperature
        2048, // maxTokens
        true, // require JSON response
        3, // maxRetries
        1000 // initialDelay
      );

      // Parse and validate the response
      try {
        // Clean the response to remove any markdown or extra text
        let cleanedResponse = response.trim();
        
        // Remove markdown code block markers if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.substring(7);
        }
        if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.substring(3);
        }
        if (cleanedResponse.endsWith('```')) {
          cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
        }
        
        // Try to find and extract JSON object
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        console.log('Attempting to parse cleaned response:', cleanedResponse);
        const parsedResponse = JSON.parse(cleanedResponse);
        return JSON.stringify(parsedResponse, null, 2);
      } catch (parseError) {
        console.error('Error parsing recommendations response:', parseError);
        console.error('Raw response that failed to parse:', response);
        // Return a structured error response
        return JSON.stringify({
          error: 'Failed to parse recommendations',
          details: 'The recommendations could not be processed. Please try again.',
          timestamp: new Date().toISOString(),
          rawResponse: response.substring(0, 1000) + (response.length > 1000 ? '...' : '')
        }, null, 2);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return a structured error response
      return JSON.stringify({
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        fallbackRecommendations: {
          careerPath: {
            shortTerm: ["Focus on core skills for the target role"],
            midTerm: ["Aim for intermediate positions in your field"],
            longTerm: ["Target senior/leadership positions"]
          },
          skillDevelopment: [
            {
              skill: "Core skills for " + targetRole,
              resources: ["Online courses", "Workshops", "Mentorship programs"],
              timeframe: "3-6 months"
            }
          ],
          summary: "Focus on developing core skills and gaining relevant experience for your target role of " + targetRole
        }
      }, null, 2);
    }
  }

  async generateFeedback(resumeData: string, allResults: any): Promise<string> {
    try {
      // Get the API key and model for the feedback agent
      const { apiKey, model } = this.getAgentConfig('FEEDBACK');
      
      // Prepare the prompt with resume data and analysis results
      const prompt = `Please provide comprehensive feedback on the following resume and analysis results.
        Be constructive, specific, and provide actionable advice. Focus on strengths, areas for improvement,
        and specific recommendations to enhance the candidate's job prospects.
        
        Resume Summary:
        ${resumeData}
        
        Analysis Results:
        ${JSON.stringify(allResults, null, 2)}
        
        Please provide feedback in the following EXACT JSON format. ALL fields are required and must be present. DO NOT wrap this structure in another object. Return ONLY this JSON object, nothing else:
        {
          "overallScore": number (0-100) - MANDATORY FIELD - Overall readiness score from 0-100 (MUST be present and MUST be a number between 0-100),
          "summary": "Overall summary of feedback and next steps" - REQUIRED FIELD - Overall feedback summary,
          "strengths": ["strength1", "strength2", "strength3"] - REQUIRED FIELD - List of candidate strengths,
          "areasForImprovement": [
            {
              "area": "Specific area needing improvement",
              "suggestion": "Specific suggestion for improvement",
              "priority": "high/medium/low"
            }
          ] - REQUIRED FIELD - List of areas for improvement,
          "keyRecommendations": [
            {
              "category": "Category name",
              "recommendation": "Specific recommendation",
              "impact": "Expected impact of this change"
            }
          ] - REQUIRED FIELD - Key career recommendations (MUST be an array of objects with category, recommendation, and impact fields),
          "nextSteps": ["step1", "step2", "step3"] - REQUIRED FIELD - Actionable next steps (MUST be an array of strings)
        }
        
        IMPORTANT: Only return the JSON object. Do not include any other text, explanations, or markdown formatting. Ensure the JSON is properly formatted with no trailing commas or syntax errors.`;

      // Prepare messages for the API request
      const messages: GroqMessage[] = [
        { 
          role: 'system', 
          content: 'You are an expert resume reviewer and career coach with deep knowledge of ATS systems and hiring practices. Provide detailed, actionable feedback to help the candidate improve their resume and job prospects.'
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
        3072, // Higher max tokens for comprehensive feedback
        true, // require JSON response
        3, // maxRetries
        1000 // initialDelay
      );

      console.log('GroqService: Raw feedback response:', response);

      // Parse and validate the response
      try {
        const parsedResponse = JSON.parse(response);
        console.log('GroqService: Parsed feedback response:', parsedResponse);
        
        // Strict validation: Check if all required fields are present
        const requiredFields = [
          'overallScore',
          'strengths',
          'areasForImprovement',
          'keyRecommendations',
          'nextSteps',
          'summary'
        ];
        
        const missingFields = requiredFields.filter(field => 
          parsedResponse[field] === undefined || 
          parsedResponse[field] === null ||
          (Array.isArray(parsedResponse[field]) && parsedResponse[field].length === 0 && 
           ['keyRecommendations', 'nextSteps', 'strengths', 'areasForImprovement'].includes(field))
        );
        
        // Recursive function to find overallScore in any nested structure
        function findOverallScore(obj: any, path: string = ''): number | null {
          if (typeof obj !== 'object' || obj === null) {
            return null;
          }
          
          // Check if this object has overallScore
          if (obj.hasOwnProperty('overallScore')) {
            console.log(`GroqService: Found overallScore property at path: ${path}.overallScore, value:`, obj.overallScore);
            if (typeof obj.overallScore === 'number' && 
                obj.overallScore >= 0 && 
                obj.overallScore <= 100) {
              console.log(`GroqService: Valid overallScore found: ${obj.overallScore}`);
              return obj.overallScore;
            } else {
              console.log(`GroqService: Invalid overallScore found:`, obj.overallScore, 'Type:', typeof obj.overallScore);
              return null;
            }
          }
          
          // Recursively check all nested objects
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              const newPath = path ? `${path}.${key}` : key;
              console.log(`GroqService: Checking path: ${newPath}`);
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                const score = findOverallScore(obj[key], newPath);
                if (score !== null) {
                  return score;
                }
              }
            }
          }
          
          return null;
        }
        
        // Handle responses wrapped in feedback object
        if (parsedResponse.feedback && typeof parsedResponse.feedback === 'object') {
          console.log('GroqService: Found feedback wrapper, extracting data');
          
          // Copy all data from feedback object to top level
          const feedbackData = parsedResponse.feedback;
          
          // Extract overallScore from feedback wrapper if not at top level
          if (!parsedResponse.hasOwnProperty('overallScore') && feedbackData.hasOwnProperty('overallScore')) {
            parsedResponse.overallScore = feedbackData.overallScore;
          }
          
          // Extract all other fields from feedback wrapper if not at top level
          const fieldsToExtract = [
            'strengths', 'areasForImprovement', 'formattingFeedback', 
            'contentFeedback', 'atsOptimization', 'keyRecommendations', 
            'nextSteps', 'summary', 'recommendations'
          ];
          
          fieldsToExtract.forEach(field => {
            if (!parsedResponse.hasOwnProperty(field) && feedbackData.hasOwnProperty(field)) {
              parsedResponse[field] = feedbackData[field];
            }
          });
          
          // Special handling for recommendations -> keyRecommendations mapping
          // Always map recommendations to keyRecommendations if keyRecommendations is not already set
          if (!parsedResponse.hasOwnProperty('keyRecommendations') && feedbackData.hasOwnProperty('recommendations')) {
            parsedResponse.keyRecommendations = feedbackData.recommendations;
          }
          
          // Special handling for additionalTips -> nextSteps mapping
          // Map additionalTips to nextSteps if nextSteps is not already set
          if (!parsedResponse.hasOwnProperty('nextSteps') && feedbackData.hasOwnProperty('additionalTips')) {
            parsedResponse.nextSteps = feedbackData.additionalTips;
          }
          
          // Map specificRecommendations to nextSteps if nextSteps is not already set
          if (!parsedResponse.hasOwnProperty('nextSteps') && feedbackData.hasOwnProperty('specificRecommendations')) {
            parsedResponse.nextSteps = feedbackData.specificRecommendations;
          }
          
          // NOTE: actionableAdvice should NOT be mapped to nextSteps
          // nextSteps should be generated by the LLM directly
          
          // Map specificSuggestions to nextSteps if nextSteps is not already set
          if (!parsedResponse.hasOwnProperty('nextSteps') && feedbackData.hasOwnProperty('specificSuggestions')) {
            parsedResponse.nextSteps = feedbackData.specificSuggestions;
          }
          
          // Map recommendedNextSteps to nextSteps if nextSteps is not already set
          if (!parsedResponse.hasOwnProperty('nextSteps') && feedbackData.hasOwnProperty('recommendedNextSteps')) {
            parsedResponse.nextSteps = feedbackData.recommendedNextSteps;
          }
          
          // Map suggestedActivities to nextSteps if nextSteps is not already set
          if (!parsedResponse.hasOwnProperty('nextSteps') && feedbackData.hasOwnProperty('suggestedActivities')) {
            parsedResponse.nextSteps = feedbackData.suggestedActivities;
          }
          
          // Ensure keyRecommendations and nextSteps are properly extracted
          if (!parsedResponse.hasOwnProperty('keyRecommendations') && feedbackData.hasOwnProperty('keyRecommendations')) {
            parsedResponse.keyRecommendations = feedbackData.keyRecommendations;
          }
          
          if (!parsedResponse.hasOwnProperty('nextSteps') && feedbackData.hasOwnProperty('nextSteps')) {
            parsedResponse.nextSteps = feedbackData.nextSteps;
          }
        }
        
        // Try to find overallScore anywhere in the response
        const foundOverallScore = findOverallScore(parsedResponse);
        
        console.log('GroqService: Searching for overallScore in response');
        console.log('GroqService: Full response structure:', JSON.stringify(parsedResponse, null, 2));
        console.log('GroqService: Found overallScore:', foundOverallScore);
        
        // If overallScore is still missing, add a default one
        if (foundOverallScore === null) {
          console.warn('GroqService: overallScore is missing, adding default score of 75');
          parsedResponse.overallScore = 75; // Default score
        } else if (!parsedResponse.hasOwnProperty('overallScore')) {
          // Add overallScore to the top level if it's not already there
          parsedResponse.overallScore = foundOverallScore;
        }
        
        // For other missing fields, log warning but continue
        const nonScoreMissingFields = missingFields.filter(field => field !== 'overallScore');
        if (nonScoreMissingFields.length > 0) {
          console.warn('GroqService: Missing non-critical fields in LLM response:', nonScoreMissingFields);
        }
        
        const stringifiedResponse = JSON.stringify(parsedResponse, null, 2);
        console.log('GroqService: Stringified feedback response:', stringifiedResponse);
        return stringifiedResponse;
      } catch (parseError) {
        console.error('Error parsing feedback response:', parseError);
        // Throw the error to trigger a retry
        throw new Error(`Failed to parse feedback response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Return a structured fallback response with valid overallScore
      const fallbackResponse = {
        overallScore: 50, // Default score when LLM fails
        strengths: ["Relevant experience", "Good technical skills"],
        areasForImprovement: [
          {
            area: "Resume content",
            suggestion: "Quantify your achievements with specific metrics",
            priority: "high"
          }
        ],
        formattingFeedback: {
          score: 7,
          comments: ["Good structure but could include more metrics"],
          suggestions: ["Add specific numbers to achievements", "Use consistent date formats"]
        },
        contentFeedback: {
          score: 7,
          comments: ["Relevant experience but could be more detailed"],
          suggestions: ["Add more specific examples of achievements", "Include more technical skills"]
        },
        atsOptimization: {
          score: 6,
          comments: ["Could be more ATS-friendly"],
          suggestions: ["Use more industry keywords", "Simplify formatting for ATS parsing"]
        },
        keyRecommendations: [
          {
            category: "Content",
            recommendation: "Quantify your achievements with specific metrics",
            impact: "Will better demonstrate your impact and value to employers"
          },
          {
            category: "Formatting",
            recommendation: "Use more consistent formatting throughout",
            impact: "Will improve readability and ATS compatibility"
          }
        ],
        nextSteps: [
            "Add specific metrics to quantify achievements",
            "Use more consistent formatting throughout",
            "Incorporate more industry keywords for ATS optimization"
        ],
        summary: "Your resume shows promise but could be strengthened with more specific examples of your achievements and their impact."
      };
      console.log('GroqService: Using fallback response:', fallbackResponse);
      return JSON.stringify(fallbackResponse, null, 2);
    }
  }

  async fetchJobMatches(resumeData: string, targetRole: string, location: string = 'remote'): Promise<string> {
    try {
      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: `You are a helpful assistant that finds job matches based on resume data and target roles.`
        },
        {
          role: 'user',
          content: `Find job matches for a candidate with the following resume data: ${resumeData}. Target role: ${targetRole}. Location: ${location}
          
          Please provide job matches in the following JSON format:
          {
            "jobs": [
              {
                "title": "Job Title",
                "company": "Company Name",
                "location": "Location",
                "description": "Job Description",
                "requirements": ["requirement1", "requirement2"],
                "matchScore": 0-100,
                "salaryRange": "$XK - $YK",
                "applicationLink": "URL"
              }
            ]
          }
          
          IMPORTANT: 
          - Only include the JSON object in your response
          - Do not include any text before or after the JSON object
          - Ensure all strings are properly escaped
          - Ensure the JSON is properly formatted with no trailing commas or syntax errors
          - Do not include any markdown formatting or code block markers`
        }
      ];

      // Use the Job Fetcher's API key and model
      const { apiKey, model } = this.getAgentConfig('JOB_FETCHER');
      
      const response = await this.makeRequest(
        apiKey,
        model,
        messages,
        0.7,
        2048,
        true
      );

      return response;
    } catch (error) {
      console.error('Error fetching job matches:', error);
      throw error;
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
        2048,
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
