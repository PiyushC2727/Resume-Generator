import { GoogleGenAI } from '@google/genai';

let aiInstance: any = null;

export function getClientApiKey(): string {
  // 1. Check Vercel build-time env variable
  const buildKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (buildKey && buildKey !== 'NOT SET') return buildKey;

  // 2. Check client-side LocalStorage
  const storageKey = localStorage.getItem('VITE_GEMINI_API_KEY');
  if (storageKey) return storageKey;

  return '';
}

export function saveClientApiKey(key: string) {
  if (key) {
    localStorage.setItem('VITE_GEMINI_API_KEY', key.trim());
  } else {
    localStorage.removeItem('VITE_GEMINI_API_KEY');
  }
}

export function getBrowserGeminiClient(): GoogleGenAI {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  // Create or reuse instance
  if (!aiInstance || aiInstance.apiKey !== apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  }

  return aiInstance;
}

/**
 * 1. AI Summary Polish
 */
export async function browserPolishSummary(text: string, field: string = 'summary'): Promise<string> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are an elite, professional resume editor and copywriter.
Polish the provided text for the "${field}" field. Make it highly engaging, impactful, metric-driven (if appropriate), and professional.
Maintain the direct meaning but significantly upgrade the vocabulary, verbs, and overall flow. Keep the length relatively similar.
Do not wrap your response in markdown or quotes; output ONLY the raw polished plain text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Original Text:\n"${text}"`,
    config: {
      systemInstruction: systemPrompt
    }
  });

  return response.text?.trim() || text;
}

/**
 * 2. AI Work Experience Bullet Polish
 */
export async function browserPolishBullet(bullet: string): Promise<string> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are a world-class executive CV writer.
Polish the provided work experience or project bullet point. Make it incredibly strong, starting with a powerful action verb (e.g., spearheaded, orchestrated, engineered).
Quantify the impact if possible (inject logical placeholder metrics/percentages like "+25% efficiency" or "$150K saved" only if the original bullet has a general sense of scale, otherwise keep it realistic and focused on clear outcomes).
Output ONLY the raw polished plain text for the bullet point, without quotes, bullets, or markdown formatting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Original Bullet Point:\n"${bullet}"`,
    config: {
      systemInstruction: systemPrompt
    }
  });

  return response.text?.trim() || bullet;
}

/**
 * 3. AI Chat Assistant & Editor
 */
export async function browserChatAssistant(resumeData: any, message: string): Promise<{ updatedResumeData: any; explanation: string }> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are a world-class professional resume editor, ATS optimization expert, and recruiter.
Your goal is to modify the provided structured resume JSON according to the user's instructions while keeping the format exactly compatible with the ResumeData schema.

Always apply these guidelines:
- Maintain extreme professional polish, using action-oriented language, quantified achievements, and clear industry terminology.
- Make the bullet points highly compelling, avoiding passive phrasing and replacing them with strong action verbs.
- Provide a brief, encouraging, professional explanation of your changes in the "explanation" property (1-3 sentences).

ResumeData Schema Structure:
{
  personalInfo: { fullName, jobTitle, email, phone, location, website, linkedin, github },
  summary: "Professional summary string",
  workExperiences: [{ id, company, position, startDate, endDate, location, isCurrent, bullets: [] }],
  educations: [{ id, institution, degree, fieldOfStudy, startDate, endDate, gpa, location, description }],
  projects: [{ id, title, description, technologies: [], link, bullets: [] }],
  skills: ["React", "TypeScript", etc],
  certifications: [{ id, name, issuer, date, link }],
  languages: [{ id, name, proficiency }],
  volunteering: [{ id, organization, role, startDate, endDate, description }],
  awards: ["Achievement 1", etc]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [
      { text: `Current Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` },
      { text: `User request:\n"${message}"` }
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        required: ['updatedResumeData', 'explanation'],
        properties: {
          updatedResumeData: {
            type: 'OBJECT',
            description: 'The updated resume JSON object matching the ResumeData schema.',
            properties: {
              personalInfo: { type: 'OBJECT' },
              summary: { type: 'STRING' },
              workExperiences: {
                type: 'ARRAY',
                items: { type: 'OBJECT' }
              },
              educations: {
                type: 'ARRAY',
                items: { type: 'OBJECT' }
              },
              projects: {
                type: 'ARRAY',
                items: { type: 'OBJECT' }
              },
              skills: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              certifications: {
                type: 'ARRAY',
                items: { type: 'OBJECT' }
              },
              languages: {
                type: 'ARRAY',
                items: { type: 'OBJECT' }
              },
              volunteering: {
                type: 'ARRAY',
                items: { type: 'OBJECT' }
              },
              awards: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              }
            }
          },
          explanation: {
            type: 'STRING',
            description: 'A summary of the changes made, tailored like a helpful resume coach.'
          }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    updatedResumeData: parsed.updatedResumeData || resumeData,
    explanation: parsed.explanation || 'Polished your resume according to request.'
  };
}

/**
 * 4. ATS Scoring & Analysis
 */
export async function browserRunATSAnalysis(resumeData: any, jobDescription: string): Promise<any> {
  const ai = getBrowserGeminiClient();
  const targetJD = jobDescription || "General professional career track";
  const systemPrompt = `You are a strict, top-tier Applicant Tracking System (ATS) parsing parser and a veteran HR Screening manager.
Analyze the candidate's resume JSON and calculate an ATS score out of 100 based on standard recruiter parameters:
- Formatting & Readability
- Compelling, metric-driven bullet points (using action verbs and clear achievements)
- Skill relevance & keyword density (compared against the provided Job Description)
- Typographic/phrasing professional standard

Your response MUST be structured as a valid JSON object matching the requested schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [
      { text: `Candidate Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` },
      { text: `Target Job Description / Industry focus:\n"${targetJD}"` }
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        required: [
          'score',
          'strengthAnalysis',
          'weaknessAnalysis',
          'missingSkills',
          'keywordGaps',
          'verbSuggestions',
          'improvementSuggestions'
        ],
        properties: {
          score: {
            type: 'INTEGER',
            description: 'An ATS score between 0 and 100.'
          },
          strengthAnalysis: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          weaknessAnalysis: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          missingSkills: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          keywordGaps: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          verbSuggestions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['original', 'suggested', 'reason'],
              properties: {
                original: { type: 'STRING' },
                suggested: { type: 'STRING' },
                reason: { type: 'STRING' }
              }
            }
          },
          improvementSuggestions: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * 5. Cover Letter Generation
 */
export async function browserGenerateCoverLetter(
  resumeData: any,
  companyName: string,
  jobTitle: string,
  recipientName: string,
  jobDescription: string
): Promise<any> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are a professional CV writing consultant.
Generate a tailored, persuasive, and professional Cover Letter for the candidate based on their resume details and the target position.
Avoid generic and overly flowery wording. Use a clean, compelling, human voice that conveys high intelligence, competence, and a genuine interest in the role.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [
      { text: `Resume:\n${JSON.stringify(resumeData, null, 2)}` },
      { text: `Job Details:\n- Company: ${companyName || 'Not specified'}\n- Title: ${jobTitle || 'Not specified'}\n- Recipient Name: ${recipientName || 'Hiring Manager'}\n- Job Description: "${jobDescription || 'Not specified'}"` }
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        required: ['recipientName', 'companyName', 'jobTitle', 'letterText'],
        properties: {
          recipientName: { type: 'STRING' },
          companyName: { type: 'STRING' },
          jobTitle: { type: 'STRING' },
          letterText: { type: 'STRING', description: 'The complete paragraphs of the cover letter with professional spacing.' }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * 6. LinkedIn Branding Suite
 */
export async function browserGenerateLinkedIn(resumeData: any): Promise<any> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are a LinkedIn personal branding expert and talent strategist.
Transform the provided resume JSON into a high-impact LinkedIn profile layout:
- Generate a compelling, high-converting Headline.
- Write an engaging, first-person "About" section that tells a narrative story.
- Outline specific bullet points for work experiences.
- Create a list of optimized keyword skills.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Resume JSON:\n${JSON.stringify(resumeData, null, 2)}`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        required: ['headline', 'about', 'experienceBullets', 'skills'],
        properties: {
          headline: { type: 'STRING' },
          about: { type: 'STRING' },
          experienceBullets: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['id', 'bullet'],
              properties: {
                id: { type: 'STRING' },
                bullet: { type: 'STRING' }
              }
            }
          },
          skills: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * 7. Premium HR Insights
 */
export async function browserGeneratePremiumInsights(resumeData: any): Promise<any> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are a professional HR career coach and executive talent consultant.
Analyze the provided resume and deliver behavioral interview questions, target job roadmaps, salary bands, and targeted skill gap analysis.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Resume JSON:\n${JSON.stringify(resumeData, null, 2)}`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        required: ['interviewQuestions', 'careerSuggestions', 'salaryInsights', 'skillGapAnalysis'],
        properties: {
          interviewQuestions: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          careerSuggestions: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          salaryInsights: {
            type: 'STRING'
          },
          skillGapAnalysis: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * 8. Auto-import & Parse Resume text/pdf
 */
export async function browserParseResume(text: string, pdfBase64?: string): Promise<any> {
  const ai = getBrowserGeminiClient();
  const systemPrompt = `You are a world-class Applicant Tracking System (ATS) parsing parser and veteran HR recruiter.
Your objective is to ingest the candidate's resume (provided either as raw text or as an attached PDF file) and structure it perfectly according to the requested ResumeData JSON schema.

Strict Ingestion Rules:
- Extract all fields faithfully. Do not fabricate or invent fake records.
- Generate unique, logical string IDs for list items (e.g. 'work-1', 'edu-1').
- Map the parsed resume structure strictly into the "parsedResume" property of the output JSON.`;

  const contents: any[] = [];
  if (pdfBase64) {
    contents.push({
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf'
      }
    });
  }
  if (text) {
    contents.push({
      text: `Raw Text Resume Content:\n${text}`
    });
  }

  contents.push({
    text: 'Please parse this resume and populate the parsedResume JSON object matching the responseSchema.'
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        required: ['parsedResume'],
        properties: {
          parsedResume: {
            type: 'OBJECT',
            properties: {
              personalInfo: {
                type: 'OBJECT',
                properties: {
                  fullName: { type: 'STRING' },
                  jobTitle: { type: 'STRING' },
                  email: { type: 'STRING' },
                  phone: { type: 'STRING' },
                  location: { type: 'STRING' },
                  website: { type: 'STRING' },
                  linkedin: { type: 'STRING' },
                  github: { type: 'STRING' }
                }
              },
              summary: { type: 'STRING' },
              workExperiences: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    company: { type: 'STRING' },
                    position: { type: 'STRING' },
                    startDate: { type: 'STRING' },
                    endDate: { type: 'STRING' },
                    location: { type: 'STRING' },
                    isCurrent: { type: 'BOOLEAN' },
                    bullets: { type: 'ARRAY', items: { type: 'STRING' } }
                  }
                }
              },
              educations: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    institution: { type: 'STRING' },
                    degree: { type: 'STRING' },
                    fieldOfStudy: { type: 'STRING' },
                    startDate: { type: 'STRING' },
                    endDate: { type: 'STRING' },
                    gpa: { type: 'STRING' },
                    location: { type: 'STRING' },
                    description: { type: 'STRING' }
                  }
                }
              },
              projects: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    title: { type: 'STRING' },
                    description: { type: 'STRING' },
                    technologies: { type: 'ARRAY', items: { type: 'STRING' } },
                    link: { type: 'STRING' },
                    bullets: { type: 'ARRAY', items: { type: 'STRING' } }
                  }
                }
              },
              skills: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              certifications: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    name: { type: 'STRING' },
                    issuer: { type: 'STRING' },
                    date: { type: 'STRING' },
                    link: { type: 'STRING' }
                  }
                }
              },
              languages: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    name: { type: 'STRING' },
                    proficiency: { type: 'STRING' }
                  }
                }
              },
              volunteering: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    organization: { type: 'STRING' },
                    role: { type: 'STRING' },
                    startDate: { type: 'STRING' },
                    endDate: { type: 'STRING' },
                    description: { type: 'STRING' }
                  }
                }
              },
              awards: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              }
            }
          }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return parsed.parsedResume || null;
}
