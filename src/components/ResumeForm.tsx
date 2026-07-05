import React, { useState } from 'react';
import { ResumeData, WorkExperience, Education, Project, Certification, Language, VolunteerExperience } from '../types';
import { browserParseResume, getClientApiKey } from '../utils/geminiClient';
import { 
  User, Briefcase, GraduationCap, Code, ShieldCheck, 
  Plus, Trash2, ArrowUpDown, Sparkles, MessageSquare, 
  HelpCircle, Globe, Award, Heart, Upload, X, AlertCircle, CheckCircle2, Loader2, FileText, FileCode, Clipboard
} from 'lucide-react';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (newData: ResumeData) => void;
  onAISummaryPolish: () => Promise<void>;
  onAIBulletPolish: (experienceId: string, bulletIndex: number) => Promise<void>;
  isAILoading: boolean;
  jobDescription: string;
  onChangeJobDescription: (jd: string) => void;
}

export default function ResumeForm({ 
  data, 
  onChange, 
  onAISummaryPolish, 
  onAIBulletPolish,
  isAILoading,
  jobDescription,
  onChangeJobDescription
}: ResumeFormProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'projects' | 'skills' | 'extra' | 'target-job'>('personal');

  // ----- AI IMPORTER STATE -----
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStep, setImportStep] = useState(0);
  const [successData, setSuccessData] = useState<ResumeData | null>(null);

  // Auto-updating loading status steps
  React.useEffect(() => {
    let interval: any;
    if (isImporting) {
      setImportStep(0);
      interval = setInterval(() => {
        setImportStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1800);
    } else {
      setImportStep(0);
    }
    return () => clearInterval(interval);
  }, [isImporting]);

  const importSteps = [
    'Reading and digesting document elements...',
    'Extracting personal details and contact links...',
    'Structuring full professional experience & projects...',
    'Inhaling academic profiles & specialized skills...',
    'Reviewing parser output & running ATS compliance checks...'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'txt' || ext === 'md' || ext === 'json') {
        setUploadedFile(file);
        setImportError(null);
      } else {
        setImportError('Unsupported file type. Please upload a PDF or plain text (.txt/.md) file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'txt' || ext === 'md' || ext === 'json') {
        setUploadedFile(file);
        setImportError(null);
      } else {
        setImportError('Unsupported file type. Please upload a PDF or plain text (.txt/.md) file.');
      }
    }
  };

  const handleParse = async () => {
    setIsImporting(true);
    setImportError(null);
    setSuccessData(null);

    try {
      let textContent = '';
      let pdfBase64Content = '';

      if (importMethod === 'paste') {
        if (!pastedText.trim()) {
          throw new Error('Please paste your resume text first.');
        }
        textContent = pastedText;
      } else {
        if (!uploadedFile) {
          throw new Error('Please select or upload a resume file first.');
        }

        const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
        if (extension === 'json') {
          // Read and parse JSON directly on the client side without AI API
          const jsonText = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(uploadedFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read JSON backup file.'));
          });
          try {
            const parsed = JSON.parse(jsonText);
            // Quick schema validation
            if (parsed && (parsed.personalInfo || parsed.summary || parsed.workExperiences)) {
              setSuccessData(parsed);
              setIsImporting(false);
              return;
            } else {
              throw new Error('Uploaded JSON does not match the required Resume schema.');
            }
          } catch (e: any) {
            throw new Error('Invalid JSON file format: ' + e.message);
          }
        } else if (extension === 'pdf') {
          // Convert PDF to base64 string
          pdfBase64Content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(uploadedFile);
            reader.onload = () => {
              const resString = reader.result as string;
              resolve(resString.split(',')[1]);
            };
            reader.onerror = (e) => reject(new Error('Failed to read PDF file.'));
          });
        } else {
          // Read text files as raw text
          textContent = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(uploadedFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(new Error('Failed to read text file.'));
          });
        }
      }

      // Make API call
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textContent || undefined,
          pdfBase64: pdfBase64Content || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse the resume.');
      }

      const responseData = await response.json();
      if (!responseData.parsedResume) {
        throw new Error('Could not extract structured data. Please try copy-pasting the text directly.');
      }

      // Set the successfully parsed data
      setSuccessData(responseData.parsedResume);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'An error occurred during parsing.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplyImport = () => {
    if (successData) {
      onChange(successData);
      setIsImportOpen(false);
      // Reset state
      setPastedText('');
      setUploadedFile(null);
      setSuccessData(null);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    });
  };

  const updateSummary = (value: string) => {
    onChange({ ...data, summary: value });
  };

  // ----- WORK EXPERIENCE METHODS -----
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `work-${Date.now()}`,
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      location: '',
      isCurrent: false,
      bullets: ['Developed new software applications and improved performance.']
    };
    onChange({
      ...data,
      workExperiences: [...data.workExperiences, newExp]
    });
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    });
  };

  const deleteExperience = (id: string) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.filter(exp => exp.id !== id)
    });
  };

  const addExpBullet = (expId: string) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.map(exp => {
        if (exp.id === expId) {
          return {
            ...exp,
            bullets: [...exp.bullets, 'Achieved metric-driven improvements in system design.']
          };
        }
        return exp;
      })
    });
  };

  const updateExpBullet = (expId: string, index: number, value: string) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.map(exp => {
        if (exp.id === expId) {
          const newBullets = [...exp.bullets];
          newBullets[index] = value;
          return { ...exp, bullets: newBullets };
        }
        return exp;
      })
    });
  };

  const deleteExpBullet = (expId: string, index: number) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.map(exp => {
        if (exp.id === expId) {
          return {
            ...exp,
            bullets: exp.bullets.filter((_, i) => i !== index)
          };
        }
        return exp;
      })
    });
  };

  // ----- EDUCATION METHODS -----
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
      location: '',
      description: ''
    };
    onChange({
      ...data,
      educations: [...data.educations, newEdu]
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...data,
      educations: data.educations.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    });
  };

  const deleteEducation = (id: string) => {
    onChange({
      ...data,
      educations: data.educations.filter(edu => edu.id !== id)
    });
  };

  // ----- PROJECTS METHODS -----
  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: '',
      description: '',
      technologies: [],
      link: '',
      bullets: ['Designed key architecture features in project system.']
    };
    onChange({
      ...data,
      projects: [...data.projects, newProj]
    });
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    onChange({
      ...data,
      projects: data.projects.map(proj => 
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    });
  };

  const deleteProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter(p => p.id !== id)
    });
  };

  const addProjBullet = (projId: string) => {
    onChange({
      ...data,
      projects: data.projects.map(p => {
        if (p.id === projId) {
          return {
            ...p,
            bullets: [...p.bullets, 'Optimized codebase workflow and API capabilities.']
          };
        }
        return p;
      })
    });
  };

  const updateProjBullet = (projId: string, index: number, value: string) => {
    onChange({
      ...data,
      projects: data.projects.map(p => {
        if (p.id === projId) {
          const newBullets = [...p.bullets];
          newBullets[index] = value;
          return { ...p, bullets: newBullets };
        }
        return p;
      })
    });
  };

  const deleteProjBullet = (projId: string, index: number) => {
    onChange({
      ...data,
      projects: data.projects.map(p => {
        if (p.id === projId) {
          return {
            ...p,
            bullets: p.bullets.filter((_, i) => i !== index)
          };
        }
        return p;
      })
    });
  };

  // ----- SKILLS METHODS -----
  const [skillInput, setSkillInput] = useState('');
  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !data.skills.includes(skillInput.trim())) {
      onChange({
        ...data,
        skills: [...data.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange({
      ...data,
      skills: data.skills.filter(s => s !== skillToRemove)
    });
  };

  // ----- CERTIFICATIONS -----
  const addCertification = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      link: ''
    };
    onChange({
      ...data,
      certifications: [...data.certifications, newCert]
    });
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const removeCertification = (id: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter(c => c.id !== id)
    });
  };

  // ----- LANGUAGES -----
  const addLanguage = () => {
    const newLang: Language = {
      id: `lang-${Date.now()}`,
      name: '',
      proficiency: 'Fluent'
    };
    onChange({
      ...data,
      languages: [...data.languages, newLang]
    });
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    onChange({
      ...data,
      languages: data.languages.map(l => 
        l.id === id ? { ...l, [field]: value } : l
      )
    });
  };

  const removeLanguage = (id: string) => {
    onChange({
      ...data,
      languages: data.languages.filter(l => l.id !== id)
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Category Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 border-b border-slate-200 bg-slate-50/50 p-1 gap-1">
        {[
          { id: 'personal', icon: <User className="w-4 h-4" />, label: 'Profile' },
          { id: 'experience', icon: <Briefcase className="w-4 h-4" />, label: 'Work' },
          { id: 'education', icon: <GraduationCap className="w-4 h-4" />, label: 'Study' },
          { id: 'projects', icon: <Code className="w-4 h-4" />, label: 'Projects' },
          { id: 'skills', icon: <ShieldCheck className="w-4 h-4" />, label: 'Skills' },
          { id: 'extra', icon: <Award className="w-4 h-4" />, label: 'More' },
          { id: 'target-job', icon: <Briefcase className="w-4 h-4 text-indigo-500" />, label: 'Job' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-880 hover:bg-slate-150'
            }`}
          >
            {tab.icon}
            <span className="mt-1 hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* 1. PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <div className="space-y-5">
            {/* AI Auto-Import Prompt Callout */}
            <div className="bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-white border border-indigo-100 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-indigo-100/80 rounded-lg text-indigo-600">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">Fast-Track with AI Importer</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal">
                  Have an existing CV? Paste your text or upload a PDF to automatically fill all fields.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-3xs hover:shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Import Previous CV
              </button>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> Personal Details
              </h3>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-Import CV</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  value={data.personalInfo.fullName} 
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Job Title Target</label>
                <input 
                  type="text" 
                  value={data.personalInfo.jobTitle} 
                  onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={data.personalInfo.email} 
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="alex.morgan@email.com"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                <input 
                  type="text" 
                  value={data.personalInfo.phone} 
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Location (City, State)</label>
                <input 
                  type="text" 
                  value={data.personalInfo.location} 
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Personal Website / Portfolio</label>
                <input 
                  type="text" 
                  value={data.personalInfo.website} 
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  placeholder="https://alexmorgan.dev"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">LinkedIn Handle</label>
                <input 
                  type="text" 
                  value={data.personalInfo.linkedin} 
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/alexmorgan"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">GitHub Handle</label>
                <input 
                  type="text" 
                  value={data.personalInfo.github} 
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  placeholder="github.com/alexmorgan"
                  className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Professional Summary */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Professional Summary</label>
                <button
                  type="button"
                  onClick={onAISummaryPolish}
                  disabled={isAILoading || !data.summary}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 px-2 py-1 rounded-lg transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  {isAILoading ? 'Polishing...' : 'Polish Summary with AI'}
                </button>
              </div>
              <textarea 
                value={data.summary} 
                onChange={(e) => updateSummary(e.target.value)}
                placeholder="Write a brief synopsis of your accomplishments and credentials..."
                rows={4}
                className="w-full text-xs p-3 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-normal"
              />
            </div>
          </div>
        )}

        {/* 2. WORK EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Work History
              </h3>
              <button 
                type="button" 
                onClick={addExperience}
                className="flex items-center gap-1 text-[11px] font-extrabold bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Job
              </button>
            </div>

            {data.workExperiences.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                No work history added yet. Click "Add Job" to begin.
              </div>
            ) : (
              <div className="space-y-6">
                {data.workExperiences.map((exp, expIdx) => (
                  <div key={exp.id} className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50 relative">
                    <button 
                      type="button"
                      onClick={() => deleteExperience(exp.id)}
                      className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Delete this role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Job #{expIdx + 1}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                        <input 
                          type="text" 
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder="TechCorp Solutions"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Your Position / Title</label>
                        <input 
                          type="text" 
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          placeholder="Senior Software Engineer"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date (YYYY-MM)</label>
                        <input 
                          type="text" 
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          placeholder="2022-03"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">End Date (or Present)</label>
                        <input 
                          type="text" 
                          value={exp.endDate}
                          disabled={exp.isCurrent}
                          onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                          placeholder="Present"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none disabled:bg-slate-100"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-5">
                        <input 
                          type="checkbox" 
                          id={`current-${exp.id}`}
                          checked={exp.isCurrent}
                          onChange={(e) => {
                            updateExperience(exp.id, 'isCurrent', e.target.checked);
                            if (e.target.checked) updateExperience(exp.id, 'endDate', 'Present');
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`current-${exp.id}`} className="text-xs font-bold text-slate-600 cursor-pointer">Current Job</label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Job Location</label>
                      <input 
                        type="text" 
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                        placeholder="San Francisco, CA"
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center border-t border-slate-200/50 pt-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Key Achievements & Responsibilities</label>
                        <button 
                          type="button" 
                          onClick={() => addExpBullet(exp.id)}
                          className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Add Bullet
                        </button>
                      </div>

                      <div className="space-y-2">
                        {exp.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-start group">
                            <textarea 
                              value={bullet}
                              onChange={(e) => updateExpBullet(exp.id, bIdx, e.target.value)}
                              rows={2}
                              className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-indigo-500"
                              placeholder="Describe your metric-driven impact..."
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => onAIBulletPolish(exp.id, bIdx)}
                                disabled={isAILoading}
                                className="p-1 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                                title="Optimize bullet with AI action verbs"
                              >
                                <Sparkles className="w-3 h-3" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => deleteExpBullet(exp.id, bIdx)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete bullet"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" /> Education History
              </h3>
              <button 
                type="button" 
                onClick={addEducation}
                className="flex items-center gap-1 text-[11px] font-extrabold bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Academic Step
              </button>
            </div>

            {data.educations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                No educational qualifications added yet.
              </div>
            ) : (
              <div className="space-y-6">
                {data.educations.map((edu, eduIdx) => (
                  <div key={edu.id} className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50 relative">
                    <button 
                      type="button"
                      onClick={() => deleteEducation(edu.id)}
                      className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Institution / University</label>
                        <input 
                          type="text" 
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          placeholder="University of California, Berkeley"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Degree</label>
                        <input 
                          type="text" 
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="Bachelor of Science"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Field of Study / Major</label>
                        <input 
                          type="text" 
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                          placeholder="Computer Science"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">GPA / Grades (e.g. 3.8/4.0)</label>
                        <input 
                          type="text" 
                          value={edu.gpa}
                          onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                          placeholder="3.82 / 4.0"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date (YYYY-MM)</label>
                        <input 
                          type="text" 
                          value={edu.startDate}
                          onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                          placeholder="2016-09"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">End Date (YYYY-MM)</label>
                        <input 
                          type="text" 
                          value={edu.endDate}
                          onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                          placeholder="2019-12"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Campus Location</label>
                        <input 
                          type="text" 
                          value={edu.location}
                          onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                          placeholder="Berkeley, CA"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Academic Details / Focus / Honors</label>
                      <textarea 
                        value={edu.description}
                        onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                        placeholder="E.g. Graduated with high honors, Dean's list, active CS club..."
                        rows={2}
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-500" /> Portfolios & Projects
              </h3>
              <button 
                type="button" 
                onClick={addProject}
                className="flex items-center gap-1 text-[11px] font-extrabold bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {data.projects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                No active projects added yet.
              </div>
            ) : (
              <div className="space-y-6">
                {data.projects.map((proj, projIdx) => (
                  <div key={proj.id} className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50 relative">
                    <button 
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Project Title</label>
                        <input 
                          type="text" 
                          value={proj.title}
                          onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                          placeholder="DevFlow Hub"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Project Link / Repo</label>
                        <input 
                          type="text" 
                          value={proj.link}
                          onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                          placeholder="https://devflow.io"
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tech Stack (comma-separated)</label>
                      <input 
                        type="text" 
                        value={proj.technologies.join(', ')}
                        onChange={(e) => {
                          const techs = e.target.value.split(',').map(item => item.trim());
                          updateProject(proj.id, 'technologies', techs);
                        }}
                        placeholder="React, AWS, Node.js"
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">One-Line Synopsis</label>
                      <input 
                        type="text" 
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                        placeholder="Describe the overarching goal of the project..."
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                      />
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Key Technical Deliverables</label>
                        <button 
                          type="button" 
                          onClick={() => addProjBullet(proj.id)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          + Add Bullet
                        </button>
                      </div>

                      <div className="space-y-2">
                        {proj.bullets && proj.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-start">
                            <textarea 
                              value={bullet}
                              onChange={(e) => updateProjBullet(proj.id, bIdx, e.target.value)}
                              rows={2}
                              className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                              placeholder="E.g. Built Socket.io sync engine handling high concurrent write peaks..."
                            />
                            <button 
                              type="button" 
                              onClick={() => deleteProjBullet(proj.id, bIdx)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. SKILLS MATRIX */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Core Competencies & Keywords
            </h3>

            <form onSubmit={addSkill} className="flex gap-2">
              <input 
                type="text" 
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="E.g. PyTorch, React, financial modeling, French..."
                className="flex-1 text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit"
                className="bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-3xs"
              >
                Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {data.skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(skill)}
                    className="text-slate-400 hover:text-red-500 font-bold transition-all"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6. EXTRA DETAILS */}
        {activeTab === 'extra' && (
          <div className="space-y-5">
            
            {/* Certifications Panel */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> Professional Credentials
                </h4>
                <button 
                  type="button" 
                  onClick={addCertification}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  + Add Cert
                </button>
              </div>

              {data.certifications.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px] bg-slate-50/50 rounded-xl">
                  No professional certifications listed.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-150 relative">
                      <button 
                        type="button" 
                        onClick={() => removeCertification(cert.id)}
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Name</label>
                        <input 
                          type="text" 
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                          placeholder="AWS Certified Architect"
                          className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Issuer</label>
                        <input 
                          type="text" 
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                          placeholder="Amazon Web Services"
                          className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Languages Panel */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-500" /> Languages
                </h4>
                <button 
                  type="button" 
                  onClick={addLanguage}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  + Add Lang
                </button>
              </div>

              {data.languages.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px] bg-slate-50/50 rounded-xl">
                  No languages listed.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.languages.map((lang) => (
                    <div key={lang.id} className="flex gap-2 items-end bg-slate-50/50 p-2 rounded-xl border border-slate-150 relative">
                      <div className="flex-1 space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Language</label>
                        <input 
                          type="text" 
                          value={lang.name}
                          onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)}
                          placeholder="Spanish"
                          className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Fluency</label>
                        <select 
                          value={lang.proficiency}
                          onChange={(e) => updateLanguage(lang.id, 'proficiency', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none font-sans"
                        >
                          <option value="Native / Bilingual">Native / Bilingual</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Professional Working">Professional Working</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Elementary">Elementary</option>
                        </select>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLanguage(lang.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Awards & Achievements */}
            <div className="space-y-3 pt-2">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" /> Honors & Achievements
                </h4>
              </div>
              <textarea 
                value={data.awards ? data.awards.join('\n') : ''}
                onChange={(e) => {
                  const arr = e.target.value.split('\n').filter(line => line.trim() !== '');
                  onChange({ ...data, awards: arr });
                }}
                placeholder="Enter each achievement on a new line..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-500 leading-normal"
              />
            </div>

          </div>
        )}
        {activeTab === 'target-job' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Target Job Description
              </h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 leading-normal font-sans font-medium">
                Pasting the job description here allows our AI Career Coach and ATS Scoring modules to analyze resume keyword gaps, suggest improvements, and tailor cover letters specifically for this position.
              </p>
              <textarea 
                value={jobDescription}
                onChange={(e) => onChangeJobDescription(e.target.value)}
                placeholder="Paste the job posting description / key requirements here..."
                rows={10}
                className="w-full text-xs p-3.5 border border-slate-250 rounded-2xl focus:outline-none focus:border-indigo-500 leading-normal bg-white"
              />
            </div>
          </div>
        )}

      </div>

      {/* ================= AI IMPORTER MODAL ================= */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm sm:text-base">AI Resume Auto-Importer</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Extract, structure & fill your profile instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isImporting) {
                    setIsImportOpen(false);
                    setSuccessData(null);
                    setImportError(null);
                    setUploadedFile(null);
                    setPastedText('');
                  }
                }}
                disabled={isImporting}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              
              {!isImporting && !successData && (
                <>
                  {/* Warning Note */}
                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 font-medium leading-normal">
                      <strong>Important:</strong> Parsing a previous resume will replace your current editor fields. To avoid losing work, you can save a copy of your current draft in the <strong>Drafts</strong> tab first.
                    </p>
                  </div>

                  {/* Method Selector Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setImportMethod('upload')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        importMethod === 'upload' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File (PDF / TXT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMethod('paste')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        importMethod === 'paste' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Copy-Paste Text</span>
                    </button>
                  </div>

                  {/* Method Panel: Drag & Drop */}
                  {importMethod === 'upload' && (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                        dragActive 
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-inner' 
                          : uploadedFile 
                            ? 'border-emerald-300 bg-emerald-50/10' 
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="file"
                        id="import-file-input"
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.md,.json"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      
                      {uploadedFile ? (
                        <>
                          <div className="p-3 bg-emerald-100/80 text-emerald-600 rounded-full">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 truncate max-w-xs">{uploadedFile.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {(uploadedFile.size / 1024).toFixed(1)} KB • Ready to Ingest
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUploadedFile(null);
                            }}
                            className="mt-1 text-[11px] font-extrabold text-red-500 hover:text-red-650 cursor-pointer"
                          >
                            Remove File
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full">
                            <Upload className="w-6 h-6 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              Drag and drop your previous CV or <span className="text-indigo-600 font-extrabold underline">browse</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                              Supports PDF, TXT, MD, or JSON (Max 10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Method Panel: Copy-Paste Text */}
                  {importMethod === 'paste' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Paste Raw Resume Text</label>
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your entire previous resume details, text, experiences, skills, projects, and contact info here..."
                        rows={8}
                        className="w-full text-xs p-3.5 border border-slate-250 rounded-2xl focus:outline-none focus:border-indigo-500 leading-normal font-sans bg-slate-50/30"
                      />
                    </div>
                  )}

                  {/* Error State */}
                  {importError && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-800">Parsing failed</p>
                        <p className="text-[11px] text-red-600 font-medium leading-normal mt-0.5">{importError}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleParse}
                      disabled={importMethod === 'upload' ? !uploadedFile : !pastedText.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Ingest & Parse with AI</span>
                    </button>
                  </div>
                </>
              )}

              {/* Loading State with dynamic staggered progress messages */}
              {isImporting && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h4 className="text-sm font-bold text-slate-800">Processing Your Resume</h4>
                    <p className="text-xs text-indigo-600 font-extrabold animate-pulse min-h-[1.5rem]">
                      {importSteps[importStep] || 'Structuring final data...'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Gemini is extracting, cleaning, and formatting your details. This usually takes around 5-10 seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* Success Confirmation State */}
              {successData && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Resume Parsed Successfully!</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Gemini completed the ATS extraction perfectly. Verify the preview below before applying.
                    </p>
                  </div>

                  {/* Extracted Data Preview Box */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3.5 divide-y divide-slate-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Candidate Profile</span>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] font-extrabold rounded-md">Verified ATS Ingestion</span>
                    </div>

                    <div className="pt-3.5 grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</span>
                        <p className="font-extrabold text-slate-850">{successData.personalInfo.fullName || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Role</span>
                        <p className="font-bold text-slate-750 truncate">{successData.personalInfo.jobTitle || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="pt-3.5 grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</span>
                        <p className="font-medium text-slate-700 truncate">{successData.personalInfo.email || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Location</span>
                        <p className="font-medium text-slate-700">{successData.personalInfo.location || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="pt-3.5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {successData.workExperiences?.length || 0} Work Experience{(successData.workExperiences?.length !== 1) ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {successData.educations?.length || 0} Education record{(successData.educations?.length !== 1) ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {successData.projects?.length || 0} Project{(successData.projects?.length !== 1) ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {successData.skills?.length || 0} Skill{(successData.skills?.length !== 1) ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSuccessData(null);
                        setUploadedFile(null);
                        setPastedText('');
                      }}
                      className="flex-1 border border-slate-250 hover:bg-slate-50 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                    >
                      Start Over
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyImport}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-3xs hover:shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Apply to CV Builder</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
