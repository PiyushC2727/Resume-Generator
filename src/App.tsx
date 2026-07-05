import React, { useState, useEffect } from 'react';
import { ResumeData, ATSAnalysis, CoverLetterData, LinkedInProfileData, PremiumInsights } from './types';
import { initialResumeData } from './utils/initialData';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import AIAssistant from './components/AIAssistant';
import ATSOptimizer from './components/ATSOptimizer';
import CoverLetterLinkedIn from './components/CoverLetterLinkedIn';
import PremiumInsightsComponent from './components/PremiumInsightsComponent';
import VersionControl from './components/VersionControlComponent';
import { generateResumeLaTeX } from './utils/latexGenerator';
import { 
  getClientApiKey, 
  saveClientApiKey, 
  browserPolishSummary, 
  browserPolishBullet, 
  browserChatAssistant, 
  browserRunATSAnalysis, 
  browserGenerateCoverLetter, 
  browserGenerateLinkedIn, 
  browserGeneratePremiumInsights 
} from './utils/geminiClient';

// @ts-ignore
import html2pdf from 'html2pdf.js';

import { 
  Sparkles, FileText, Bot, TrendingUp, History, 
  HelpCircle, Award, Printer, Copy, FileJson, 
  Code, Eye, Settings, Palette, Layout, Scaling, 
  Download, Briefcase, GraduationCap, Check, HelpCircle as HelpIcon, Info,
  Linkedin, Compass, X, ExternalLink, RefreshCw, Key
} from 'lucide-react';

export default function App() {
  // Core resume state preloaded with master software engineer alex morgan
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);

  // Layout parameters
  const [templateId, setTemplateId] = useState<string>('silicon-valley');
  const [colorAccent, setColorAccent] = useState<string>('indigo');
  const [spacing, setSpacing] = useState<'compact' | 'standard' | 'spacious'>('standard');

  // Interactive sidebar workspace tab selection
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'editor' | 'coach' | 'ats' | 'branding' | 'insights' | 'snapshots'>('editor');

  // AI loading and integration state
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedInProfileData | null>(null);
  const [coachInsights, setCoachInsights] = useState<PremiumInsights | null>(null);

  // Copy feedbacks
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // LaTeX PDF compilation states
  const [previewMode, setPreviewMode] = useState<'html' | 'pdf'>('html');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isCompilingPDF, setIsCompilingPDF] = useState<boolean>(false);

  // Shared target job description state
  const [jobDescription, setJobDescription] = useState<string>('');

  // API Key & Settings states
  const [apiKey, setApiKey] = useState<string>(getClientApiKey());
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Helper trigger to handle client side copy alerts
  const showCopyAlert = (setFeedback: (val: boolean) => void) => {
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  };

  // -------------------------------------------------------------
  // AI ACTION 1: POLISH RESUME SUMMARY (LOCAL Sparkle trigger)
  // -------------------------------------------------------------
  const handleAISummaryPolish = async () => {
    if (!resumeData.summary) return;
    setIsAILoading(true);
    try {
      const polished = await browserPolishSummary(resumeData.summary, 'summary');
      setResumeData(prev => ({
        ...prev,
        summary: polished
      }));
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('Unable to polish summary:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // AI ACTION 2: POLISH INDIVIDUAL WORK BULLET
  // -------------------------------------------------------------
  const handleAIBulletPolish = async (experienceId: string, bulletIndex: number) => {
    const targetExperience = resumeData.workExperiences.find(exp => exp.id === experienceId);
    if (!targetExperience) return;
    const bulletText = targetExperience.bullets[bulletIndex];
    if (!bulletText) return;

    setIsAILoading(true);
    try {
      const polished = await browserPolishBullet(bulletText);
      setResumeData(prev => ({
        ...prev,
        workExperiences: prev.workExperiences.map(exp => {
          if (exp.id === experienceId) {
            const newBullets = [...exp.bullets];
            newBullets[bulletIndex] = polished;
            return { ...exp, bullets: newBullets };
          }
          return exp;
        })
      }));
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('Unable to polish bullet:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // AI ACTION 3: CHAT ASSISTANT SEND MESSAGE (Modifies Resume State)
  // -------------------------------------------------------------
  const handleSendMessage = async (text: string) => {
    setIsAILoading(true);
    try {
      const result = await browserChatAssistant(resumeData, text);
      if (result.updatedResumeData) {
        setResumeData(result.updatedResumeData);
      }
      return { explanation: result.explanation };
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      }
      throw err;
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // AI ACTION 4: ATS EVALUATOR SCAN & AUTO OPTIMIZE
  // -------------------------------------------------------------
  const handleRunATSAnalysis = async (jobDescription?: string) => {
    setIsAILoading(true);
    try {
      const analysis = await browserRunATSAnalysis(resumeData, jobDescription || '');
      setAtsAnalysis(analysis);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('ATS evaluation failed:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  const handleApplyATSOptimization = async () => {
    if (!atsAnalysis) return;
    setIsAILoading(true);
    try {
      const result = await browserChatAssistant(
        resumeData,
        `Incorporate the following missing skills directly into my core skills list: ${atsAnalysis.missingSkills.join(', ')}. Rewrite my bullet points to reflect these keyword goals: ${atsAnalysis.keywordGaps.slice(0, 4).join(', ')}.`
      );
      if (result.updatedResumeData) {
        setResumeData(result.updatedResumeData);
        alert('Resume optimized! Core keyword gaps populated into core skills.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('ATS optimization failed:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // AI ACTION 5: COVER LETTER GENERATOR
  // -------------------------------------------------------------
  const handleGenerateCoverLetter = async (company: string, title: string, manager: string, jd: string) => {
    setIsAILoading(true);
    try {
      const coverLetter = await browserGenerateCoverLetter(resumeData, company, title, manager, jd);
      setCoverLetter(coverLetter);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('Cover letter generation failed:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // AI ACTION 6: LINKEDIN OPTIMIZATION SUITE
  // -------------------------------------------------------------
  const handleGenerateLinkedIn = async () => {
    setIsAILoading(true);
    try {
      const linkedinProfile = await browserGenerateLinkedIn(resumeData);
      setLinkedinProfile(linkedinProfile);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('LinkedIn branding failed:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // AI ACTION 7: PREMIUM CAREER COACH INSIGHTS
  // -------------------------------------------------------------
  const handleGenerateInsights = async () => {
    setIsAILoading(true);
    try {
      const insights = await browserGeneratePremiumInsights(resumeData);
      setCoachInsights(insights);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
      } else {
        alert('Unable to generate career coach insights:\n' + err.message);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  // -------------------------------------------------------------
  // EXPORTS UTILITY SUITE
  // -------------------------------------------------------------
  const triggerPrintPDF = () => {
    setIsExportOpen(true);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(resumeData, null, 2));
    showCopyAlert(setCopiedJson);
  };

  const handleDownloadJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(resumeData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `resume_backup_${resumeData.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const compilePDF = async () => {
    // Deprecated in browser-only mode since we compile directly on download
  };

  const handleDownloadPDF = async () => {
    setIsAILoading(true);
    try {
      const element = document.getElementById('resume-preview-container');
      if (!element) {
        throw new Error('Active resume layout element preview container was not found in DOM.');
      }
      
      const opt = {
        margin:       [0.15, 0.15, 0.15, 0.15],
        filename:     `resume_${resumeData.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.2, useCORS: true, letterRendering: true, dpi: 192 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (err: any) {
      console.error(err);
      alert('Failed to compile and download PDF:\n' + err.message);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleDownloadLaTeX = () => {
    const latexString = `data:text/plain;charset=utf-8,${encodeURIComponent(generateLaTeX())}`;
    const a = document.createElement('a');
    a.href = latexString;
    a.download = `resume_${resumeData.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.tex`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadMarkdown = () => {
    const mdString = `data:text/markdown;charset=utf-8,${encodeURIComponent(generateMarkdown())}`;
    const a = document.createElement('a');
    a.href = mdString;
    a.download = `resume_${resumeData.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadPlainText = () => {
    const txtString = `data:text/plain;charset=utf-8,${encodeURIComponent(generatePlainText())}`;
    const a = document.createElement('a');
    a.href = txtString;
    a.download = `resume_${resumeData.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadDOCX = () => {
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.4; margin: 1in; }
            h1 { text-align: center; text-transform: uppercase; margin-bottom: 5px; }
            .subheader { text-align: center; margin-bottom: 20px; color: #555; }
            h2 { border-bottom: 1px solid #333; text-transform: uppercase; font-size: 14px; margin-top: 20px; }
            .item { margin-bottom: 15px; }
            .item-title { font-weight: bold; }
            .item-date { float: right; font-weight: normal; }
            .bullets { margin-top: 5px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <h1>${resumeData.personalInfo.fullName}</h1>
          <div class="subheader">
            ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.email} | ${resumeData.personalInfo.location}<br>
            ${resumeData.personalInfo.linkedin} | ${resumeData.personalInfo.github}
          </div>
          
          <h2>Professional Summary</h2>
          <p>${resumeData.summary}</p>
          
          <h2>Experience</h2>
          ${resumeData.workExperiences.map(exp => `
            <div class="item">
              <span class="item-title">${exp.position} at ${exp.company}</span>
              <span class="item-date">${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate}</span>
              <div style="color: #666; font-size: 12px;">${exp.location}</div>
              <ul class="bullets">
                ${exp.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          
          <h2>Skills</h2>
          <p>${resumeData.skills.join(', ')}</p>
          
          <h2>Education</h2>
          ${resumeData.educations.map(edu => `
            <div class="item">
              <span class="item-title">${edu.degree} in ${edu.fieldOfStudy}</span>
              <span class="item-date">${edu.startDate} - ${edu.endDate}</span>
              <div>${edu.institution} | GPA: ${edu.gpa}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${resumeData.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const generateLaTeX = (): string => {
    return generateResumeLaTeX(resumeData, templateId, colorAccent, spacing);
  };

  const handleCopyLaTeX = () => {
    navigator.clipboard.writeText(generateLaTeX());
    showCopyAlert(setCopiedLatex);
  };

  const generateMarkdown = (): string => {
    const { personalInfo, summary, workExperiences, educations, projects, skills } = resumeData;
    return `# ${personalInfo.fullName}
## ${personalInfo.jobTitle}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone}
- Location: ${personalInfo.location}
- LinkedIn: ${personalInfo.linkedin}
- GitHub: ${personalInfo.github}

---

## Professional Summary
${summary}

---

## Core Technologies
${skills.map(s => `- ${s}`).join('\n')}

---

## Professional Experience
${workExperiences.map(exp => `
### ${exp.position} at ${exp.company}
*${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate} | ${exp.location}*
${exp.bullets.map(b => `- ${b}`).join('\n')}
`).join('\n')}

---

## Education
${educations.map(edu => `
### ${edu.institution}
*${edu.degree} in ${edu.fieldOfStudy} | GPA: ${edu.gpa} | ${edu.startDate} - ${edu.endDate}*
${edu.description ? `_${edu.description}_` : ''}
`).join('\n')}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    showCopyAlert(setCopiedMd);
  };

  const generatePlainText = (): string => {
    const { personalInfo, summary, workExperiences, educations, skills } = resumeData;
    return `
=========================================================
${personalInfo.fullName.toUpperCase()} - ${personalInfo.jobTitle.toUpperCase()}
=========================================================
Contact: ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
Portfolio: ${personalInfo.website}
GitHub: ${personalInfo.github} | LinkedIn: ${personalInfo.linkedin}

PROFESSIONAL SUMMARY:
${summary}

WORK HISTORY:
${workExperiences.map(exp => `
- ${exp.position.toUpperCase()} at ${exp.company} (${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate})
  Location: ${exp.location}
  Achievements:
${exp.bullets.map(b => `  * ${b}`).join('\n')}
`).join('\n')}

EDUCATION:
${educations.map(edu => `
- ${edu.institution} (${edu.startDate} - ${edu.endDate})
  Degree: ${edu.degree} in ${edu.fieldOfStudy} (GPA: ${edu.gpa})
`).join('\n')}

TECHNICAL SKILLS:
${skills.join(', ')}
`;
  };

  const handleCopyPlainText = () => {
    navigator.clipboard.writeText(generatePlainText());
    showCopyAlert(setCopiedTxt);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-10">
      
      {/* 1. HEADER (No-print for PDF compilation) */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-3xs no-print">
        {/* API Key missing notification */}
        {!apiKey && (
          <div className="bg-amber-50 border-b border-amber-250 p-2.5 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
            <span>🔑 Gemini API Key not configured. AI features are disabled.</span>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] uppercase font-extrabold tracking-wider transition-all cursor-pointer"
            >
              Configure Key
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xs flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-950 tracking-tight">AI Resume Studio</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ATS Optimization Engine V3.5</span>
              </div>
            </div>
          </div>

          {/* Quick PDF Trigger & Settings */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all"
              title="API Settings"
            >
              <Key className="w-4 h-4" />
            </button>
            <button 
              onClick={triggerPrintPDF}
              className="text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Export Perfect PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. DUAL CONTAINER LAYOUT */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6 relative">
        
        {/* ================= LEFT SIDEBAR: MODULAR TOOLSETS (No-print) ================= */}
        <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-5 no-print">
          
          {/* Section Selector Hub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-3xs grid grid-cols-3 sm:grid-cols-6 gap-1">
            {[
              { id: 'editor', icon: <FileText className="w-4 h-4" />, label: 'CV Builder' },
              { id: 'coach', icon: <Bot className="w-4 h-4" />, label: 'AI Chat' },
              { id: 'ats', icon: <TrendingUp className="w-4 h-4" />, label: 'ATS Meter' },
              { id: 'branding', icon: <Linkedin className="w-4 h-4" />, label: 'LinkedIn' },
              { id: 'insights', icon: <Compass className="w-4 h-4" />, label: 'Coach' },
              { id: 'snapshots', icon: <History className="w-4 h-4" />, label: 'Drafts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveWorkspaceTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer text-[10px] font-extrabold transition-all ${
                  activeWorkspaceTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span className="mt-1">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Core Panel Content Box */}
          <div className="flex-1 h-[calc(100vh-220px)] min-h-[500px]">
            {activeWorkspaceTab === 'editor' && (
              <ResumeForm 
                data={resumeData} 
                onChange={setResumeData}
                onAISummaryPolish={handleAISummaryPolish}
                onAIBulletPolish={handleAIBulletPolish}
                isAILoading={isAILoading}
                jobDescription={jobDescription}
                onChangeJobDescription={setJobDescription}
              />
            )}
            {activeWorkspaceTab === 'coach' && (
              <AIAssistant 
                onSendMessage={handleSendMessage}
                isAILoading={isAILoading}
                onApplyPrompt={(prompt) => handleSendMessage(prompt)}
              />
            )}
            {activeWorkspaceTab === 'ats' && (
              <ATSOptimizer 
                analysis={atsAnalysis}
                onRunAnalysis={handleRunATSAnalysis}
                onApplyOptimization={handleApplyATSOptimization}
                isAILoading={isAILoading}
                jobDescription={jobDescription}
                onChangeJobDescription={setJobDescription}
              />
            )}
            {activeWorkspaceTab === 'branding' && (
              <CoverLetterLinkedIn 
                resumeData={resumeData}
                coverLetter={coverLetter}
                linkedinProfile={linkedinProfile}
                onGenerateCoverLetter={handleGenerateCoverLetter}
                onGenerateLinkedIn={handleGenerateLinkedIn}
                isAILoading={isAILoading}
                jobDescription={jobDescription}
              />
            )}
            {activeWorkspaceTab === 'insights' && (
              <PremiumInsightsComponent 
                insights={coachInsights}
                onGenerateInsights={handleGenerateInsights}
                isAILoading={isAILoading}
              />
            )}
            {activeWorkspaceTab === 'snapshots' && (
              <VersionControl 
                currentData={resumeData}
                onRestore={setResumeData}
              />
            )}
          </div>
        </div>

        {/* ================= RIGHT PREVIEW CANVAS: LIVE RESUME PAPER ================= */}
        <div className="flex-1 flex flex-col gap-5">
          
          {/* Controls Bar (No-print) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-wrap items-center justify-between gap-4 no-print">
            {/* Design Controls */}
            <div className="flex flex-wrap items-center gap-5">
              
              {/* Spacing / Margin */}
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spacing</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                  {['compact', 'standard', 'spacious'].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setSpacing(sp as any)}
                      className={`px-2 py-1 text-[10px] font-extrabold rounded-md capitalize cursor-pointer transition-all ${
                        spacing === sp ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accent</span>
                <div className="flex gap-1">
                  {[
                    { id: 'indigo', bg: 'bg-indigo-600' },
                    { id: 'slate', bg: 'bg-slate-700' },
                    { id: 'emerald', bg: 'bg-emerald-600' },
                    { id: 'rose', bg: 'bg-rose-600' },
                    { id: 'sky', bg: 'bg-sky-600' },
                    { id: 'amber', bg: 'bg-amber-600' },
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setColorAccent(color.id)}
                      className={`w-5 h-5 rounded-full ${color.bg} cursor-pointer border-2 transition-all hover:scale-110 flex items-center justify-center ${
                        colorAccent === color.id ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
                      }`}
                      title={color.id}
                    >
                      {colorAccent === color.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Picker */}
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template</span>
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    if (previewMode === 'pdf') {
                      setTimeout(compilePDF, 100);
                    }
                  }}
                  className="text-xs font-bold p-1.5 border border-slate-200 rounded-lg focus:outline-none bg-slate-50"
                >
                  <option value="silicon-valley">Silicon Valley (Modern Tech)</option>
                  <option value="mckinsey">McKinsey (Consulting Serif)</option>
                  <option value="goldman-sachs">Goldman Sachs (Finance Compact)</option>
                  <option value="google-inspired">Google (Skills First)</option>
                  <option value="executive-modern">Executive Modern (Sleek Banner)</option>
                  <option value="graduate-entry">Graduate Entry (Academic Focus)</option>
                </select>
              </div>

              {/* Preview Mode Indicator */}
              <div className="flex items-center gap-2 border-l border-slate-250 pl-4">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instant Live Preview</span>
              </div>

            </div>

            {/* Quick Export drop down list */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyLaTeX}
                className="text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                title="Copy complete LaTeX document engineering code"
              >
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>{copiedLatex ? 'LaTeX Copied!' : 'Copy LaTeX'}</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                title="Copy markdown structure"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{copiedMd ? 'Markdown Copied!' : 'Copy MD'}</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                title="Download JSON state backup"
              >
                <FileJson className="w-3.5 h-3.5 text-slate-500" />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Printable visual frame */}
          <div className="flex justify-center bg-slate-100 border border-slate-200/50 rounded-2xl p-4 sm:p-6 overflow-x-auto main-container">
            <div id="resume-preview-container" className="w-full flex justify-center">
              <ResumePreview 
                data={resumeData}
                templateId={templateId}
                colorAccent={colorAccent}
                spacing={spacing}
              />
            </div>
          </div>

          {/* Quick instructions (No-print) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 items-start no-print">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-slate-900">Printing Guideline</h5>
              <p className="text-[11px] text-slate-500 leading-normal font-sans">
                To compile your resume as a perfect physical document or A4 file, click <strong>"Export Perfect PDF"</strong> on the top bar. This will trigger the native system print window which uses print stylesheets to automatically hide all sandbox panels, margins, and headers, outputting the unblemished resume paper. Make sure to tick <strong>"Hide headers and footers"</strong> and set <strong>"Background graphics"</strong> to on.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* ================= EXPORT & SHARE HUB MODAL ================= */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Printer className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm sm:text-base">Export & Backup Hub</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Download, print or copy your resume in professional formats</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* PDF Compilation Layout */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Printers & PDF Generation</span>
                </h4>

                {isInIframe ? (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-950">Sandboxed Preview Detected</p>
                        <p className="text-[11px] text-indigo-700 leading-normal font-medium">
                          You are currently viewing this editor inside a sandboxed iframe. Modern browsers block printing and file downloads in nested frames. 
                        </p>
                      </div>
                    </div>
                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-3xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Editor in New Tab</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-250 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        Try Printing Here Anyway
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-950">Direct Print Mode Active</p>
                        <p className="text-[11px] text-emerald-700 leading-normal font-medium">
                          Excellent! You are running this app directly in a full-tab view. Printing will compile only the resume sheet.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={isAILoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-3xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isAILoading ? 'Compiling LaTeX...' : 'Download LaTeX-Compiled PDF'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print/Save HTML Layout</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Print Best Practices */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-[11px] text-slate-500 space-y-1.5 leading-normal font-medium">
                  <p className="font-bold text-slate-700">💡 Perfect PDF Checklist (For Print Settings):</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Set <strong>Destination</strong> to <strong>"Save as PDF"</strong>.</li>
                    <li>Toggle on <strong>"Background graphics"</strong> (required to preserve accents & backgrounds).</li>
                    <li>Toggle off <strong>"Headers and footers"</strong> (removes unwanted URL and date stamps).</li>
                    <li>Set Margins to <strong>"None"</strong> or <strong>"Default"</strong>.</li>
                  </ul>
                </div>
              </div>

              {/* Core Code & Backup Formats */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  <span>Extractions & Local Backups</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* LaTeX Item */}
                    <div className="border border-slate-150 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between hover:bg-slate-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Code className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-extrabold text-slate-800">LaTeX Source Code</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                          Ready-to-compile Academic LaTeX document syntax.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={handleCopyLaTeX}
                          className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/60 hover:border-indigo-155 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadLaTeX}
                          className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get .tex</span>
                        </button>
                      </div>
                    </div>

                    {/* Word DOCX Item */}
                    <div className="border border-slate-150 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between hover:bg-slate-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-extrabold text-slate-800">Microsoft Word (DOCX)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                          Editable Word document formatted for Microsoft Office.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadDOCX}
                        className="w-full mt-2 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/60 hover:border-indigo-150 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Word DOC</span>
                      </button>
                    </div>

                    {/* Markdown Item */}
                    <div className="border border-slate-150 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between hover:bg-slate-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-extrabold text-slate-800">Markdown Format</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                          Structured text ideal for GitHub profile READMEs or portfolios.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={handleCopyMarkdown}
                          className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/60 hover:border-indigo-155 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadMarkdown}
                          className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get .md</span>
                        </button>
                      </div>
                    </div>

                    {/* Plain Text Item */}
                    <div className="border border-slate-150 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between hover:bg-slate-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-extrabold text-slate-800">Plain Text Summary</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                          Beautiful plain text format for quick form copy-pasting.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={handleCopyPlainText}
                          className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/60 hover:border-indigo-155 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPlainText}
                          className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get .txt</span>
                        </button>
                      </div>
                    </div>

                    {/* JSON Backup Item */}
                    <div className="border border-slate-150 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between hover:bg-slate-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <FileJson className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-extrabold text-slate-800">State Backup JSON</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                          Raw data backup. Safe to upload directly to the AI CV Importer.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={handleCopyJSON}
                          className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/60 hover:border-indigo-150 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                          title="Copy raw JSON string"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadJSON}
                          className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                          title="Download JSON file backup"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                  </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= SETTINGS DIALOG ================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-1.5">
                <Key className="w-5 h-5 text-indigo-600" />
                <span>Gemini API Key Settings</span>
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-normal">
              Provide your own Gemini API Key to enable the professional AI Resume Writer, Coach, and ATS Scanner. Your key is stored safely in your local browser storage.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">API Key</label>
              <input 
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Paste your AQ.Ab8RN6... or AIzaSy... key here"
                className="w-full text-xs p-3 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setTempApiKey(apiKey);
                  setIsSettingsOpen(false);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveClientApiKey(tempApiKey);
                  setApiKey(tempApiKey);
                  setIsSettingsOpen(false);
                }}
                className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all shadow-3xs hover:shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
