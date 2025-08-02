export interface ResumeData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: EducationItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  summary?: string;
  uploadedAt: Date;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
  duration?: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface JobRole {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experience: string;
  salary: string;
  location: string;
}

export interface SkillGap {
  skill: string;
  importance: number;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
}

export interface RoleFitResult {
  score: number;
  justification: string;
  strengths: string[];
  improvements: string[];
}

export interface PersonalityProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  summary: string;
}

// Updated LearningPath interface to reflect the new data structure
export interface LearningPath {
  title: string;
  skillCovered: string;
  description: string;
  link: string;
  provider: string;
}

// The Course interface is no longer needed with the flattened structure.

export interface JobSuggestion {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  description: string;
  requiredSkills: string[];
}

export interface FeedbackResult {
  message: string;
  encouragement: string;
  actionItems: string[];
  nextSteps: string[];
}