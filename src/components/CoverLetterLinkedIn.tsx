import React, { useState } from 'react';
import { CoverLetterData, LinkedInProfileData, ResumeData } from '../types';
import { 
  FileText, Linkedin, Sparkles, Copy, Check, 
  RefreshCw, Briefcase, ChevronRight, UserCheck
} from 'lucide-react';

interface CoverLetterLinkedInProps {
  resumeData: ResumeData;
  coverLetter: CoverLetterData | null;
  linkedinProfile: LinkedInProfileData | null;
  onGenerateCoverLetter: (company: string, title: string, manager: string, jd: string) => Promise<void>;
  onGenerateLinkedIn: () => Promise<void>;
  isAILoading: boolean;
}

export default function CoverLetterLinkedIn({
  resumeData,
  coverLetter,
  linkedinProfile,
  onGenerateCoverLetter,
  onGenerateLinkedIn,
  isAILoading
}: CoverLetterLinkedInProps) {
  const [activeSubTab, setActiveSubTab] = useState<'cover' | 'linkedin'>('cover');

  // Cover letter form state
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [managerName, setManagerName] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  // Clipboard feedbacks
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [copiedAbout, setCopiedAbout] = useState(false);

  const copyToClipboard = (text: string, setFeedback: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Sub tabs */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('cover')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'cover' 
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Cover Letter
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('linkedin')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'linkedin' 
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Linkedin className="w-4 h-4" /> LinkedIn Optimizer
        </button>
      </div>

      {/* Viewport panels */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* --- PANEL A: COVER LETTER GENERATOR --- */}
        {activeSubTab === 'cover' && (
          <div className="space-y-5">
            {!coverLetter ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-indigo-900 leading-normal font-medium">
                    Our AI Cover Letter Generator draws achievements directly from your CV, tailoring them dynamically to match your target job's specific pain points and core requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Target Company</label>
                    <input 
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Job Position Title</label>
                    <input 
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Hiring Manager / Recipient Name (Optional)</label>
                  <input 
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Jane Doe (or 'Hiring Manager')"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Job Description (Highly Recommended)</label>
                  <textarea 
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Paste details of the role to optimize and contextualize the letter..."
                    rows={4}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none leading-normal"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onGenerateCoverLetter(companyName, jobTitle, managerName, jobDesc)}
                  disabled={isAILoading || !companyName || !jobTitle}
                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 disabled:bg-slate-100 hover:bg-indigo-700 text-white disabled:text-slate-400 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAILoading ? 'Synthesizing Professional Cover Letter...' : 'Generate Customized Cover Letter'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">GENERATED SUCCESSFUL</span>
                    <h4 className="text-xs font-bold text-slate-800">Cover Letter for {coverLetter.companyName}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(coverLetter.letterText, setCopiedLetter)}
                      className="text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs"
                    >
                      {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLetter ? 'Copied' : 'Copy Text'}
                    </button>
                    <button
                      onClick={() => onGenerateCoverLetter(companyName, jobTitle, managerName, jobDesc)}
                      className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Cover letter sheet representation */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 font-serif text-xs sm:text-sm text-slate-800 leading-relaxed max-w-2xl mx-auto">
                  <div className="space-y-1 font-sans">
                    <strong>{resumeData.personalInfo.fullName}</strong>
                    <div className="text-slate-500 text-[11px]">{resumeData.personalInfo.email} | {resumeData.personalInfo.phone}</div>
                    <div className="text-slate-400 text-[10px]">{resumeData.personalInfo.location}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-1 font-sans">
                    <div className="text-slate-500 text-[11px]">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="font-bold text-slate-800">{coverLetter.recipientName}</div>
                    <div className="text-slate-500 text-[11px]">Hiring Committee</div>
                    <strong>{coverLetter.companyName}</strong>
                  </div>

                  <p className="font-bold font-sans text-xs">Subject: Application for {coverLetter.jobTitle}</p>

                  <p className="whitespace-pre-line text-slate-700 leading-relaxed text-justify">
                    {coverLetter.letterText}
                  </p>

                  <div className="pt-4 font-sans text-xs">
                    <div>Sincerely,</div>
                    <strong className="block mt-4 text-slate-900">{resumeData.personalInfo.fullName}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PANEL B: LINKEDIN PROFILE OPTIMIZER --- */}
        {activeSubTab === 'linkedin' && (
          <div className="space-y-5">
            {!linkedinProfile ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Linkedin className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="font-extrabold text-slate-950 text-sm">Optimize Your LinkedIn Persona</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Convert your offline document resume into a high-converting digital branding profile. We generate search-optimized headers, engaging biographical narratives, and profile summaries.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onGenerateLinkedIn}
                  disabled={isAILoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAILoading ? 'Formulating LinkedIn Strategy...' : 'Generate LinkedIn Branding Assets'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. LinkedIn Headline */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">1. LinkedIn Profile Headline</span>
                    <button
                      onClick={() => copyToClipboard(linkedinProfile.headline, setCopiedHeadline)}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-all"
                    >
                      {copiedHeadline ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Headline
                    </button>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                    {linkedinProfile.headline}
                  </div>
                </div>

                {/* 2. LinkedIn About */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">2. Personal Brand Narrative (About)</span>
                    <button
                      onClick={() => copyToClipboard(linkedinProfile.about, setCopiedAbout)}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-all"
                    >
                      {copiedAbout ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Summary
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line text-justify font-sans">
                    {linkedinProfile.about}
                  </div>
                </div>

                {/* 3. Core Keywords and skills to pin */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">3. Suggested Skill Pins & Keywords</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {linkedinProfile.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGenerateLinkedIn}
                  disabled={isAILoading}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-formulate Branding Assets
                </button>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
