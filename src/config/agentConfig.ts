// Environment variables in Vite need to be prefixed with VITE_
// Make sure these are set in your .env file
// Example: VITE_GROQ_DATA_AGENT_KEY=your_key_here

export const AGENT_KEYS = {
  DATA_AGENT: import.meta.env.VITE_GROQ_DATA_AGENT_KEY || '',
  SKILL_ANALYZER: import.meta.env.VITE_GROQ_SKILL_ANALYZER_KEY || '',
  CAREER_FIT: import.meta.env.VITE_GROQ_CAREER_FIT_KEY || '',
  PERSONALITY: import.meta.env.VITE_GROQ_PERSONALITY_KEY || '',
  RECOMMENDATION: import.meta.env.VITE_GROQ_RECOMMENDATION_KEY || '',
  JOB_FETCHER: import.meta.env.VITE_GROQ_JOB_FETCHER_KEY || '',
  FEEDBACK: import.meta.env.VITE_GROQ_FEEDBACK_KEY || '',
};
