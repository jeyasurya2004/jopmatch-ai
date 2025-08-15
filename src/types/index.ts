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

export interface LearningPath {
  title: string;
  skillCovered: string;
  description: string;
  link: string;
  provider: string;
}

export interface JobSuggestion {
  id?: string; // Made optional
  title: string;
  company: string;
  location: string;
  salary?: string; // Made optional
  matchScore?: number; // Made optional
  description: string;
  requiredSkills?: string[]; // Made optional
  url: string; // Added url property
}

export interface FeedbackResult {
  message: string;
  encouragement: string;
  actionItems: string[];
  nextSteps: string[];
}
