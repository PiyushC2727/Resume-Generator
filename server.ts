import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import rateLimit from 'express-rate-limit';
import { getDbConnection } from './db';

const execPromise = promisify(exec);

dotenv.config();

// Define port and host
const PORT = 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));

// Apply rate limiting middleware to prevent API abuse in production hosting (e.g. Railway)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 API requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP address. Please try again in 15 minutes.'
  }
});

app.use('/api', apiLimiter);

// Lazy initializer for the Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Resilient helper to execute model content generation with automatic retries and model fallbacks
 * to handle temporary model overloading (503 Service Unavailable / 429 Too Many Requests).
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3
): Promise<any> {
  const modelsToTry = [options.model];
  if (options.model === 'gemini-3.5-flash') {
    modelsToTry.push('gemini-flash-latest');
    modelsToTry.push('gemini-3.1-flash-lite');
  } else if (options.model === 'gemini-flash-latest') {
    modelsToTry.push('gemini-3.5-flash');
    modelsToTry.push('gemini-3.1-flash-lite');
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini SDK] Calling generateContent with model="${model}" (attempt ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          ...options,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorMessage = err.message || '';
        const statusCode = err.status || (err.error && err.error.code);
        console.log(`[Gemini SDK Info] Attempt ${attempt} with model="${model}" yielded status: ${statusCode || 'unknown'}. Details: "${errorMessage.slice(0, 200)}"`);
        
        const isRateLimit = statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
        const isUnavailable = 
          statusCode === 503 || 
          errorMessage.includes('503') || 
          errorMessage.includes('UNAVAILABLE') || 
          errorMessage.includes('high demand') ||
          errorMessage.includes('temporarily unavailable');

        if (!isRateLimit && !isUnavailable) {
          throw err;
        }

        // If it is a 503/UNAVAILABLE or "high demand" error, immediately switch to the next model candidate
        if (isUnavailable) {
          console.log(`[Gemini SDK] Model "${model}" is temporarily overloaded (503/UNAVAILABLE). Instantly failing over to fallback options...`);
          break; // Break the current retry loop to advance to the next candidate model
        }

        // For rate limits, apply backoff and retry
        if (attempt < maxRetries) {
          const backoffDelay = attempt * 1500;
          console.log(`[Gemini SDK] Rate limit (429) detected. Retrying model="${model}" in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    console.log(`[Gemini SDK Info] Moving to fallback candidate model because "${model}" is temporarily congested...`);
  }

  throw lastError || new Error('All candidate Gemini models failed due to transient high demand. Please try again shortly.');
}

// REST API Endpoints for AI Resume Generation

/**
 * 1. AI Resume Chat Assistant
 * Updates the structured resume dynamically based on user prompt.
 */
app.post('/api/resume/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData, message } = req.body;
    if (!resumeData || !message) {
      return res.status(400).json({ error: 'Missing resumeData or message.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a world-class professional resume editor, ATS optimization expert, and executive recruiter.
Your goal is to modify the provided structured resume JSON according to the user's instructions while keeping the format exactly compatible with the ResumeData schema.

Always apply these guidelines:
- Maintain extreme professional polish, using action-oriented language, quantified achievements (e.g. percentages, dollars, hours saved), and clear industry terminology.
- Make the bullet points highly compelling, avoiding passive phrasing ("responsible for", "assisted with") and replacing them with strong verbs ("spearheaded", "engineered", "championed").
- Ensure all sections conform strictly to the standard JSON structure provided. Do not invent custom top-level keys. Only return the updated JSON inside the "updatedResume" property.
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

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Current Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` },
        { text: `User request:\n"${message}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['updatedResumeData', 'explanation'],
          properties: {
            updatedResumeData: {
              type: Type.OBJECT,
              description: 'The updated resume JSON object matching the ResumeData schema.',
              properties: {
                personalInfo: { type: Type.OBJECT },
                summary: { type: Type.STRING },
                workExperiences: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT }
                },
                educations: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT }
                },
                projects: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT }
                },
                skills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                certifications: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT }
                },
                languages: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT }
                },
                volunteering: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT }
                },
                awards: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            },
            explanation: {
              type: Type.STRING,
              description: 'A summary of the changes made, tailored like a helpful resume coach.'
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    const resultJson = JSON.parse(resultText);
    res.json(resultJson);
  } catch (error: any) {
    console.error('Error in /api/resume/chat:', error);
    res.status(500).json({ error: error.message || 'An error occurred during chat optimization.' });
  }
});

/**
 * 2. ATS Optimization System & Reviewer
 * Evaluates the resume, detects missing keywords, calculates ATS score, and suggests improvements.
 */
app.post('/api/resume/ats', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData.' });
    }

    const ai = getGeminiClient();
    const targetJD = jobDescription || "General professional career track";
    
    const systemPrompt = `You are a strict, top-tier Applicant Tracking System (ATS) parsing parser and a veteran HR Screening manager.
Analyze the candidate's resume JSON and calculate an ATS score out of 100 based on standard recruiter parameters:
- Formatting & Readability
- Compelling, metric-driven bullet points (using action verbs and clear achievements)
- Skill relevance & keyword density (compared against the provided Job Description)
- Typographic/phrasing professional standard

Your response MUST be structured as a valid JSON object matching the requested schema.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Candidate Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` },
        { text: `Target Job Description / Industry focus:\n"${targetJD}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
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
              type: Type.INTEGER,
              description: 'An ATS score between 0 and 100.'
            },
            strengthAnalysis: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key positive aspects of the resume (e.g. strong phrasing, quantifiable bullet points, relevant certifications).'
            },
            weaknessAnalysis: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Areas of concern (e.g. weak verbs, spelling/grammar risks, lack of metrics).'
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Crucial technical/soft skills identified in the Job Description that are missing from the resume.'
            },
            keywordGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific ATS keywords found in the Job Description but absent or under-represented in the resume.'
            },
            verbSuggestions: {
              type: Type.ARRAY,
              description: 'Specific improvement suggestions for weak verbs in work/project bullets.',
              items: {
                type: Type.OBJECT,
                required: ['original', 'suggested', 'reason'],
                properties: {
                  original: { type: Type.STRING, description: 'The weak verb or phrase (e.g., "Responsible for writing")' },
                  suggested: { type: Type.STRING, description: 'The strong action verb suggestion (e.g., "Engineered")' },
                  reason: { type: Type.STRING, description: 'Why this is better (e.g., "Conveys ownership and technical command.")' }
                }
              }
            },
            improvementSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable steps the candidate can take to raise their score above 90+.'
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json({ analysis: JSON.parse(resultText) });
  } catch (error: any) {
    console.error('Error in /api/resume/analyze:', error);
    res.status(500).json({ error: error.message || 'An error occurred during resume analysis.' });
  }
});

/**
 * 3. Job Description Auto-Optimizer
 * Rewrites key parts of the resume automatically to align directly with a Job Description.
 */
app.post('/api/resume/optimize', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Missing resumeData or jobDescription.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are an elite career development strategist and resume tailoring specialist.
Your task is to take the provided resume JSON and the Job Description, and rewrite/tailor the resume's summary, skills list, and work experience bullets to maximize keyword alignment, highlight matching accomplishments, and directly address the requirements of the job description.

Rules:
- Never lie or fabricate major metrics. Instead, rephrase existing descriptions using the target job's keywords and highlight relevant technologies.
- Improve existing bullet points to sound highly professional, metric-driven, and tailored.
- Inject missing keywords naturally into the skills array and bullet points.
- Ensure the result conforms perfectly to the ResumeData structure. Do not return markdown wraps; return the exact JSON payload.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Original Resume:\n${JSON.stringify(resumeData, null, 2)}` },
        { text: `Target Job Description:\n"${jobDescription}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['optimizedResume', 'summaryOfOptimizations'],
          properties: {
            optimizedResume: {
              type: Type.OBJECT,
              properties: {
                personalInfo: { type: Type.OBJECT },
                summary: { type: Type.STRING },
                workExperiences: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                educations: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                projects: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                certifications: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                languages: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                volunteering: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                awards: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            summaryOfOptimizations: {
              type: Type.STRING,
              description: 'Bullet points or summary detailing what key terms and achievements were optimized to align with the job.'
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error in /api/resume/optimize:', error);
    res.status(500).json({ error: error.message || 'An error occurred during resume optimization.' });
  }
});

/**
 * 4. Cover Letter Generator
 * Generates a tailored, ATS-friendly cover letter based on the candidate's resume and job posting.
 */
app.post('/api/resume/cover-letter', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData, jobDescription, companyName, jobTitle, recipientName } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a professional CV writing consultant.
Generate a tailored, persuasive, and professional Cover Letter for the candidate based on their resume details and the target position.
Avoid generic and overly flowery wording. Use a clean, compelling, human voice that conveys high intelligence, competence, and a genuine interest in the role. Ensure strong correlation between the candidate's achievements and the job requirements.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Resume:\n${JSON.stringify(resumeData, null, 2)}` },
        { text: `Job Details:\n- Company: ${companyName || 'Not specified'}\n- Title: ${jobTitle || 'Not specified'}\n- Recipient Name: ${recipientName || 'Hiring Manager'}\n- Job Description: "${jobDescription || 'Not specified'}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['recipientName', 'companyName', 'jobTitle', 'letterText'],
          properties: {
            recipientName: { type: Type.STRING },
            companyName: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            letterText: { type: Type.STRING, description: 'The complete paragraphs of the cover letter with professional spacing.' }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json({ coverLetter: JSON.parse(resultText) });
  } catch (error: any) {
    console.error('Error in /api/resume/cover-letter:', error);
    res.status(500).json({ error: error.message || 'An error occurred during cover letter generation.' });
  }
});

/**
 * 5. LinkedIn Profile Optimizer
 * Formulates a tailored LinkedIn Headline, About section, and experience summaries.
 */
app.post('/api/resume/linkedin', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a LinkedIn personal branding expert and talent strategist.
Transform the provided resume JSON into a high-impact LinkedIn profile layout:
- Generate a compelling, high-converting Headline (e.g. featuring core credentials, value proposition, and keywords).
- Write an engaging, first-person "About" section that tells a narrative story, highlighting career passion, key competencies, and call to action.
- Outline specific bullet points for key work experiences tailored for LinkedIn (often slightly more conversational yet highly professional and outcome-focused).
- Create a list of optimized keyword skills to pin on the profile.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['headline', 'about', 'experienceBullets', 'skills'],
          properties: {
            headline: { type: Type.STRING },
            about: { type: Type.STRING },
            experienceBullets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['id', 'bullet'],
                properties: {
                  id: { type: Type.STRING, description: 'The unique ID or identifier matching the work experience.' },
                  bullet: { type: Type.STRING, description: 'LinkedIn-optimized description of accomplishments.' }
                }
              }
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json({ linkedinProfile: JSON.parse(resultText) });
  } catch (error: any) {
    console.error('Error in /api/resume/linkedin:', error);
    res.status(500).json({ error: error.message || 'An error occurred during LinkedIn optimization.' });
  }
});

/**
 * 6. Premium Interview & Insights Generator
 * Creates personalized interview preparation questions, career progression plans, and skill roadmaps.
 */
app.post('/api/resume/premium', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a professional HR career coach and executive talent consultant.
Analyze the provided resume and deliver:
1. Five highly customized, difficult behavioral or technical interview questions tailored to the candidate's specific background and technologies.
2. Career suggestions & progression roadmap (e.g. next positions to target, industry trends).
3. Salary Insights (estimated range based on locations, roles, and technologies).
4. A targeted Skill Gap Analysis outlining 3-5 key technologies or frameworks they should learn next to double their market value.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['interviewQuestions', 'careerSuggestions', 'salaryInsights', 'skillGapAnalysis'],
          properties: {
            interviewQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of 5 interview questions targeting the candidate\'s achievements.'
            },
            careerSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Target job titles, promotions, and industry suggestions.'
            },
            salaryInsights: {
              type: Type.STRING,
              description: 'A descriptive analysis of typical salary bands and how to negotiate a higher compensation based on this background.'
            },
            skillGapAnalysis: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A detailed breakdown of critical skills, tools, or frameworks the candidate is missing to level up.'
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json({ premiumInsights: JSON.parse(resultText) });
  } catch (error: any) {
    console.error('Error in /api/resume/premium:', error);
    res.status(500).json({ error: error.message || 'An error occurred during premium insights generation.' });
  }
});

/**
 * 7. Professional LaTeX Code Builder
 * Converts the resume JSON into pristine LaTeX source code using professional CV layouts.
 */
app.post('/api/resume/latex', async (req: express.Request, res: express.Response) => {
  try {
    const { resumeData, templateId } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are an expert LaTeX document designer and typographer.
Convert the provided Resume JSON into a pristine, beautifully formatted, error-free LaTeX document CV source code.
Ensure that:
- You use standard, widely supported LaTeX packages (e.g. article, hyperref, geometry, enumitem, titlesec, charter or lmodern fonts).
- The syntax is flawless, with proper character escaping (e.g. escape &, _, %, $, #, etc.).
- There are no unclosed blocks or custom non-standard macro definitions.
- The formatting is exceptionally elegant, with proper section spacing and bullet margins.
- Return a JSON response with the property "latexCode" containing the complete LaTeX document source as a string.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Resume JSON:\n${JSON.stringify(resumeData, null, 2)}` },
        { text: `Target Template Design Style: "${templateId || 'silicon-valley'}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['latexCode'],
          properties: {
            latexCode: {
              type: Type.STRING,
              description: 'The raw, ready-to-compile, fully escaped LaTeX source code document.'
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error in /api/resume/latex:', error);
    res.status(500).json({ error: error.message || 'An error occurred during LaTeX code generation.' });
  }
});

/**
 * REST API for Resume Drafts snap-saving to MySQL Database
 */
app.get('/api/drafts', async (req: express.Request, res: express.Response) => {
  try {
    const db = await getDbConnection();
    const [rows] = await db.query('SELECT id, name, timestamp, resume_data AS data FROM resume_drafts ORDER BY timestamp DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('[DB Error] Failed to fetch drafts:', error);
    res.status(500).json({ error: 'Failed to load drafts from database.' });
  }
});

app.post('/api/drafts', async (req: express.Request, res: express.Response) => {
  try {
    const { id, name, timestamp, data } = req.body;
    if (!id || !name || !data) {
      return res.status(400).json({ error: 'Missing id, name, or data.' });
    }
    const db = await getDbConnection();
    await db.query(
      'INSERT INTO resume_drafts (id, name, timestamp, resume_data) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), timestamp = VALUES(timestamp), resume_data = VALUES(resume_data)',
      [id, name, timestamp || new Date().toLocaleString(), JSON.stringify(data)]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DB Error] Failed to save draft:', error);
    res.status(500).json({ error: 'Failed to save draft in database.' });
  }
});

app.delete('/api/drafts/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing draft ID.' });
    }
    const db = await getDbConnection();
    await db.query('DELETE FROM resume_drafts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DB Error] Failed to delete draft:', error);
    res.status(500).json({ error: 'Failed to delete draft from database.' });
  }
});

/**
 * 7.5. Dynamic LaTeX Compiler Service
 * Compiles a raw LaTeX string into a binary PDF file stream.
 */
app.post('/api/resume/compile', async (req: express.Request, res: express.Response) => {
  let tempDir: string | null = null;
  try {
    const { latexCode } = req.body;
    if (!latexCode) {
      return res.status(400).json({ error: 'Missing latexCode.' });
    }

    const baseTempDir = path.join(process.cwd(), 'temp_builds');
    if (!fs.existsSync(baseTempDir)) {
      fs.mkdirSync(baseTempDir, { recursive: true });
    }

    const uniqueId = `build_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    tempDir = path.join(baseTempDir, uniqueId);
    fs.mkdirSync(tempDir);

    const texFilePath = path.join(tempDir, 'resume.tex');
    const pdfFilePath = path.join(tempDir, 'resume.pdf');

    fs.writeFileSync(texFilePath, latexCode, 'utf8');

    // Resolve platform-agnostic Tectonic command
    let tectonicCmd = 'tectonic'; // default to global command in system PATH
    const localWindowsTectonic = path.resolve(process.cwd(), '../../bin/tectonic.exe');
    const localLinuxTectonic = path.resolve(process.cwd(), '../../bin/tectonic');

    if (process.platform === 'win32' && fs.existsSync(localWindowsTectonic)) {
      tectonicCmd = `"${localWindowsTectonic}"`;
    } else if (process.platform !== 'win32' && fs.existsSync(localLinuxTectonic)) {
      tectonicCmd = `"${localLinuxTectonic}"`;
    }

    console.log(`[Tectonic Compiler] Compiling resume in ${tempDir} using command: ${tectonicCmd}`);

    const options = {
      cwd: tempDir,
      env: {
        ...process.env,
        PATH: `${path.resolve(process.cwd(), '../../bin')}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`
      }
    };

    await execPromise(`${tectonicCmd} "${texFilePath}"`, options);

    if (!fs.existsSync(pdfFilePath)) {
      throw new Error('Tectonic compilation completed, but resume.pdf was not generated.');
    }

    const pdfBuffer = fs.readFileSync(pdfFilePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[Tectonic Compiler Error]:', error);
    const errorMessage = error.stderr || error.stdout || error.message || 'LaTeX compilation failed.';
    res.status(500).json({
      error: 'LaTeX compilation failed. Please check LaTeX markup syntax.',
      details: errorMessage
    });
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error('Failed to clean up temp build directory:', cleanupErr);
      }
    }
  }
});

/**
 * 8. Polish Resume Summary (or other text fields)
 */
app.post('/api/resume/polish', async (req: express.Request, res: express.Response) => {
  try {
    const { text, field } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text to polish.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are an elite, professional resume editor and copywriter.
Polish the provided text for the "${field || 'resume'}" field. Make it highly engaging, impactful, metric-driven (if appropriate), and professional.
Maintain the direct meaning but significantly upgrade the vocabulary, verbs, and overall flow. Keep the length relatively similar.
Do not wrap your response in markdown or quotes; output ONLY the raw polished plain text.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Original Text:\n"${text}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json({ polishedText: resultText.trim() });
  } catch (error: any) {
    console.error('Error in /api/resume/polish:', error);
    res.status(500).json({ error: error.message || 'An error occurred during text polishing.' });
  }
});

/**
 * 9. Polish Individual Work Bullet
 */
app.post('/api/resume/polish-bullet', async (req: express.Request, res: express.Response) => {
  try {
    const { bullet } = req.body;
    if (!bullet) {
      return res.status(400).json({ error: 'Missing bullet text to polish.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a world-class executive CV writer.
Polish the provided work experience or project bullet point. Make it incredibly strong, starting with a powerful action verb (e.g., spearheaded, orchestrated, engineered).
Quantify the impact if possible (inject logical placeholder metrics/percentages like "+25% efficiency" or "$150K saved" only if the original bullet has a general sense of scale, otherwise keep it realistic and focused on clear outcomes).
Output ONLY the raw polished plain text for the bullet point, without quotes, bullets, or markdown formatting.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        { text: `Original Bullet Point:\n"${bullet}"` }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from AI model.');
    }
    res.json({ polishedBullet: resultText.trim() });
  } catch (error: any) {
    console.error('Error in /api/resume/polish-bullet:', error);
    res.status(500).json({ error: error.message || 'An error occurred during bullet polishing.' });
  }
});

/**
 * 10. Auto-import & Parse Resume
 * Takes pasted text or a base64-encoded PDF and parses it into structured ResumeData JSON.
 */
app.post('/api/resume/parse', async (req: express.Request, res: express.Response) => {
  try {
    const { text, pdfBase64 } = req.body;
    if (!text && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide either pasted text or an uploaded PDF file.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a world-class Applicant Tracking System (ATS) parsing parser and veteran HR recruiter.
Your objective is to ingest the candidate's resume (provided either as raw text or as an attached PDF file) and structure it perfectly according to the requested ResumeData JSON schema.

Strict Ingestion Rules:
- Extract all fields faithfully. Do not fabricate or invent fake records.
- For lists of items (workExperiences, educations, projects, certifications, languages, volunteering), make sure to generate unique, logical string IDs for each item (e.g., 'work-1', 'work-2', 'edu-1', 'edu-2', 'proj-1', 'cert-1', etc.).
- Ensure all bullet points under experience and projects are cleaned up, starting with action verbs, grammatically flawless, and professionally formatted.
- If a section is completely empty or missing from the raw resume (e.g. no volunteering or no projects), return an empty array [] for that section.
- Extract contact details like linkedin, github, email, phone, location, and website into the personalInfo section. If not present, keep them as empty strings.
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

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['parsedResume'],
          properties: {
            parsedResume: {
              type: Type.OBJECT,
              description: 'The parsed resume matching the ResumeData schema.',
              properties: {
                personalInfo: {
                  type: Type.OBJECT,
                  properties: {
                    fullName: { type: Type.STRING },
                    jobTitle: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    location: { type: Type.STRING },
                    website: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    github: { type: Type.STRING }
                  }
                },
                summary: { type: Type.STRING },
                workExperiences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      company: { type: Type.STRING },
                      position: { type: Type.STRING },
                      startDate: { type: Type.STRING },
                      endDate: { type: Type.STRING },
                      location: { type: Type.STRING },
                      isCurrent: { type: Type.BOOLEAN },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                educations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      institution: { type: Type.STRING },
                      degree: { type: Type.STRING },
                      fieldOfStudy: { type: Type.STRING },
                      startDate: { type: Type.STRING },
                      endDate: { type: Type.STRING },
                      gpa: { type: Type.STRING },
                      location: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  }
                },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                      link: { type: Type.STRING },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                skills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                certifications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      issuer: { type: Type.STRING },
                      date: { type: Type.STRING },
                      link: { type: Type.STRING }
                    }
                  }
                },
                languages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      proficiency: { type: Type.STRING }
                    }
                  }
                },
                volunteering: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      organization: { type: Type.STRING },
                      role: { type: Type.STRING },
                      startDate: { type: Type.STRING },
                      endDate: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  }
                },
                awards: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Parsing service returned an empty response.');
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error in /api/resume/parse:', error);
    res.status(500).json({ error: error.message || 'An error occurred while parsing your resume.' });
  }
});

// Setup Vite Dev Middleware / Production Static Asset Handling
async function initializeServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware mounted successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static asset serving configured.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`World-Class Resume Generator active on http://localhost:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error('Failed to start server:', err);
});
