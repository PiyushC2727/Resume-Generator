export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: string;
  location: string;
  description: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link: string;
  bullets: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: string; // e.g. Native, Fluent, Professional, Conversational
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperiences: WorkExperience[];
  educations: Education[];
  projects: Project[];
  skills: string[]; // E.g. ["React", "TypeScript", "Node.js"]
  certifications: Certification[];
  languages: Language[];
  volunteering: VolunteerExperience[];
  awards: string[]; // Achievements
}

// AI Analysis Models
export interface ATSAnalysis {
  score: number;
  strengthAnalysis: string[];
  weaknessAnalysis: string[];
  missingSkills: string[];
  keywordGaps: string[];
  verbSuggestions: { original: string; suggested: string; reason: string }[];
  improvementSuggestions: string[];
}

export interface CoverLetterData {
  recipientName: string;
  companyName: string;
  jobTitle: string;
  letterText: string;
}

export interface LinkedInProfileData {
  headline: string;
  about: string;
  experienceBullets: { id: string; bullet: string }[];
  skills: string[];
}

export interface PremiumInsights {
  interviewQuestions: string[];
  careerSuggestions: string[];
  salaryInsights: string;
  skillGapAnalysis: string[];
}

export interface ResumeVersion {
  id: string;
  name: string;
  timestamp: string;
  data: ResumeData;
}
