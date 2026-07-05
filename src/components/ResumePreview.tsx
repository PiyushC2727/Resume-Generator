import React from 'react';
import { ResumeData } from '../types';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  templateId: string;
  colorAccent: string;
  spacing: 'compact' | 'standard' | 'spacious';
}

export default function ResumePreview({ data, templateId, colorAccent, spacing }: ResumePreviewProps) {
  const { personalInfo, summary, workExperiences, educations, projects, skills, certifications, languages, volunteering, awards } = data;

  // Spacing class mapping
  const spacingMap = {
    compact: {
      padding: 'p-6 sm:p-8',
      gap: 'gap-3',
      sectionGap: 'gap-2.5',
      itemGap: 'gap-1',
      listGap: 'space-y-0.5',
      textBase: 'text-[11px] leading-relaxed',
      textSm: 'text-[10px]',
      textLg: 'text-sm',
      textXl: 'text-xl',
      borderPadding: 'pb-1 mb-1',
    },
    standard: {
      padding: 'p-8 sm:p-10',
      gap: 'gap-5',
      sectionGap: 'gap-4',
      itemGap: 'gap-2',
      listGap: 'space-y-1',
      textBase: 'text-xs sm:text-sm leading-relaxed',
      textSm: 'text-xs',
      textLg: 'text-base',
      textXl: 'text-2xl',
      borderPadding: 'pb-1.5 mb-1.5',
    },
    spacious: {
      padding: 'p-10 sm:p-12',
      gap: 'gap-6',
      sectionGap: 'gap-5.5',
      itemGap: 'gap-3',
      listGap: 'space-y-2',
      textBase: 'text-sm sm:text-base leading-relaxed',
      textSm: 'text-xs sm:text-sm',
      textLg: 'text-lg',
      textXl: 'text-3xl',
      borderPadding: 'pb-2 mb-2',
    }
  };

  const s = spacingMap[spacing];

  // Primary color mappings
  const colorMap: Record<string, { text: string; bg: string; border: string; bullet: string }> = {
    indigo: { text: 'text-indigo-800', bg: 'bg-indigo-600', border: 'border-indigo-600', bullet: 'text-indigo-600' },
    slate: { text: 'text-slate-800', bg: 'bg-slate-700', border: 'border-slate-700', bullet: 'text-slate-700' },
    emerald: { text: 'text-emerald-800', bg: 'bg-emerald-600', border: 'border-emerald-600', bullet: 'text-emerald-600' },
    rose: { text: 'text-rose-800', bg: 'bg-rose-600', border: 'border-rose-600', bullet: 'text-rose-600' },
    sky: { text: 'text-sky-800', bg: 'bg-sky-600', border: 'border-sky-600', bullet: 'text-sky-600' },
    amber: { text: 'text-amber-800', bg: 'bg-amber-600', border: 'border-amber-600', bullet: 'text-amber-600' },
  };

  const c = colorMap[colorAccent] || colorMap.indigo;

  // Custom typography per template
  const fontClass = {
    'silicon-valley': 'font-sans',
    'mckinsey': 'font-serif',
    'goldman-sachs': 'font-sans tracking-tight',
    'google-inspired': 'font-sans',
    'executive-modern': 'font-display',
    'graduate-entry': 'font-sans',
  }[templateId] || 'font-sans';

  // Format Year-Month to readable date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.toLowerCase() === 'present') return 'Present';
    const parts = dateStr.split('-');
    if (parts.length === 2) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return dateStr;
  };

  return (
    <div id="resume-document" className={`resume-paper ${fontClass} bg-white text-slate-800 w-full max-w-[800px] min-h-[1050px] shadow-lg rounded-sm transition-all overflow-hidden ${s.padding} flex flex-col ${s.gap} border border-slate-100`}>
      
      {/* ----------------- TEMPLATE 1: SILICON VALLEY (MODERN TECH) ----------------- */}
      {(templateId === 'silicon-valley' || !templateId) && (
        <>
          {/* Header */}
          <div className="flex flex-col gap-1.5 border-b-2 border-slate-900 pb-4">
            <h1 className={`${s.textXl} font-extrabold tracking-tight text-slate-900 uppercase`}>
              {personalInfo.fullName || 'Alex Morgan'}
            </h1>
            <p className={`${s.textLg} font-semibold ${c.text}`}>
              {personalInfo.jobTitle || 'Senior Software Engineer'}
            </p>
            {/* Contact Row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-slate-500 font-medium mt-1">
              {personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{personalInfo.email}</span>}
              {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{personalInfo.phone}</span>}
              {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{personalInfo.location}</span>}
              {personalInfo.website && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{personalInfo.website}</span>}
              {personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3.5 h-3.5" />{personalInfo.linkedin}</span>}
              {personalInfo.github && <span className="flex items-center gap-1"><Github className="w-3.5 h-3.5" />{personalInfo.github}</span>}
            </div>
          </div>

          {/* Professional Summary */}
          {summary && (
            <div className="flex flex-col gap-1">
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900">Professional Summary</h2>
              <p className={s.textBase}>{summary}</p>
            </div>
          )}

          {/* Work Experience */}
          {workExperiences && workExperiences.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 border-b border-slate-200 pb-1">Work Experience</h2>
              <div className="flex flex-col gap-4">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {exp.position} <span className="font-medium text-slate-500">at {exp.company}</span>
                      </h3>
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <p className={`${s.textSm} text-slate-400 font-medium flex items-center gap-1 mb-1`}>
                      <MapPin className="w-3 h-3" /> {exp.location}
                    </p>
                    <ul className={`${s.listGap} list-disc pl-4 text-slate-700`}>
                      {exp.bullets.map((b, i) => (
                        <li key={i} className={s.textBase}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Grid */}
          {skills && skills.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 border-b border-slate-200 pb-1">Core Skills & Expertise</h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill, index) => (
                  <span key={index} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Two-Column Grid for Education and Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            {educations && educations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 border-b border-slate-200 pb-1">Education</h2>
                <div className="flex flex-col gap-3">
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex flex-col gap-0.5">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{edu.degree} in {edu.fieldOfStudy}</h3>
                      <p className="text-xs font-semibold text-slate-600">{edu.institution}</p>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>GPA: {edu.gpa || 'N/A'}</span>
                        <span>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                      </div>
                      {edu.description && <p className={`${s.textSm} text-slate-500 mt-1 italic`}>{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects / Certifications */}
            <div className="flex flex-col gap-3">
              {projects && projects.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 border-b border-slate-200 pb-1">Featured Projects</h2>
                  <div className="flex flex-col gap-3">
                    {projects.slice(0, 2).map((proj) => (
                      <div key={proj.id} className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{proj.title}</h3>
                          {proj.link && <span className="text-[10px] text-indigo-600 font-medium hover:underline">{proj.link}</span>}
                        </div>
                        <p className={`${s.textSm} text-slate-600 leading-snug`}>{proj.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.technologies.map((t, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded-sm font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Awards and Certifications combined row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
            {certifications && certifications.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 border-b border-slate-200 pb-1">Certifications</h2>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {certifications.map((c) => (
                    <li key={c.id} className={s.textSm}>
                      <span className="font-semibold text-slate-800">{c.name}</span> — {c.issuer} ({formatDate(c.date)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {awards && awards.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 border-b border-slate-200 pb-1">Honors & Achievements</h2>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {awards.map((a, idx) => (
                    <li key={idx} className={s.textSm}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* ----------------- TEMPLATE 2: MCKINSEY STYLE (MANAGEMENT CONSULTING - CLASSIC SERIF) ----------------- */}
      {templateId === 'mckinsey' && (
        <div className="text-center flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col items-center gap-1 border-b border-slate-300 pb-4">
            <h1 className="text-2xl sm:text-3xl font-serif tracking-wide text-slate-900 font-medium">
              {personalInfo.fullName || 'Alex Morgan'}
            </h1>
            <p className="text-xs sm:text-sm uppercase tracking-widest font-sans font-semibold text-slate-500">
              {personalInfo.jobTitle || 'Management Consultant'}
            </p>
            {/* Contact Details Grid */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2 font-serif">
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.email && <span>• {personalInfo.email}</span>}
              {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
              {personalInfo.website && <span>• {personalInfo.website}</span>}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="text-left font-serif leading-relaxed italic text-slate-700 max-w-3xl mx-auto">
              <p className={s.textBase}>"{summary}"</p>
            </div>
          )}

          {/* Experience */}
          {workExperiences && workExperiences.length > 0 && (
            <div className="text-left flex flex-col gap-3">
              <h2 className="font-serif font-semibold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                Professional Experience
              </h2>
              <div className="flex flex-col gap-4">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline font-serif">
                      <span className="font-bold text-slate-900 text-sm sm:text-base italic">
                        {exp.company}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs font-serif italic text-slate-500">
                      <span>{exp.position}</span>
                      <span>{exp.location}</span>
                    </div>
                    <ul className={`${s.listGap} list-disc pl-5 text-slate-700 mt-1 font-serif`}>
                      {exp.bullets.map((b, i) => (
                        <li key={i} className={s.textBase}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {educations && educations.length > 0 && (
            <div className="text-left flex flex-col gap-3">
              <h2 className="font-serif font-semibold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                Education
              </h2>
              <div className="flex flex-col gap-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex flex-col gap-0.5 font-serif">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-sm">{edu.institution}</span>
                      <span className="text-xs text-slate-500">{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                    </div>
                    <div className="flex justify-between text-xs italic text-slate-600">
                      <span>{edu.degree} in {edu.fieldOfStudy}</span>
                      <span>GPA: {edu.gpa || 'N/A'}</span>
                    </div>
                    {edu.description && <p className={`${s.textSm} text-slate-500 mt-0.5`}>{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects and Technical Strengths Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {skills && skills.length > 0 && (
              <div className="flex flex-col gap-2 font-serif">
                <h2 className="font-serif font-semibold text-xs uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  Skills & Core Competencies
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700 pt-1 leading-relaxed">
                  {skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.bg} mr-1.5`}></span>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {projects && projects.length > 0 && (
              <div className="flex flex-col gap-2 font-serif">
                <h2 className="font-serif font-semibold text-xs uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  Selected Projects
                </h2>
                <div className="flex flex-col gap-3">
                  {projects.slice(0, 2).map((proj) => (
                    <div key={proj.id} className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-slate-800 text-xs italic">{proj.title}</h4>
                      <p className={`${s.textSm} text-slate-600`}>{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TEMPLATE 3: GOLDMAN SACHS (COMPACT CORPORATE FINANCE) ----------------- */}
      {templateId === 'goldman-sachs' && (
        <div className="flex flex-col gap-4 text-xs tracking-tight">
          {/* Centered Sleek Title */}
          <div className="text-center border-b border-slate-800 pb-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {personalInfo.fullName}
            </h1>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 font-medium mt-1">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>| {personalInfo.phone}</span>}
              {personalInfo.location && <span>| {personalInfo.location}</span>}
              {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
              {personalInfo.website && <span>| {personalInfo.website}</span>}
            </div>
          </div>

          {/* Education first (Traditional for finance/IB) */}
          {educations && educations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h2 className="font-bold text-[11px] uppercase border-b border-slate-300 pb-0.5 tracking-wider text-slate-900">
                Education
              </h2>
              {educations.map((edu) => (
                <div key={edu.id} className="flex flex-col">
                  <div className="flex justify-between items-baseline font-bold">
                    <span>{edu.institution.toUpperCase()}</span>
                    <span>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-slate-700">
                    <span>{edu.degree} in {edu.fieldOfStudy}</span>
                    <span className="font-semibold">GPA: {edu.gpa || 'N/A'}</span>
                  </div>
                  {edu.description && <p className="text-[10px] text-slate-500 italic mt-0.5">{edu.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Professional Experience */}
          {workExperiences && workExperiences.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-[11px] uppercase border-b border-slate-300 pb-0.5 tracking-wider text-slate-900">
                Professional Experience
              </h2>
              <div className="flex flex-col gap-3">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="flex flex-col">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{exp.company.toUpperCase()}</span>
                      <span className="font-semibold text-slate-500">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-slate-600 italic">
                      <span>{exp.position}</span>
                      <span>{exp.location}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 mt-1">
                      {exp.bullets.map((b, i) => (
                        <li key={i} className="text-[11px] leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Transactions / Projects */}
          {projects && projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h2 className="font-bold text-[11px] uppercase border-b border-slate-300 pb-0.5 tracking-wider text-slate-900">
                Key Projects & Technical Initiatives
              </h2>
              {projects.map((proj) => (
                <div key={proj.id} className="flex flex-col mb-1.5">
                  <div className="flex justify-between font-bold">
                    <span>{proj.title}</span>
                    <span className="text-slate-500 font-medium text-[10px]">{proj.link}</span>
                  </div>
                  <p className="text-slate-600 text-[10px] leading-relaxed mb-0.5">{proj.description}</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                    {proj.bullets && proj.bullets.map((bul, idx) => (
                      <li key={idx} className="text-[10px]">{bul}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Skills & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills && skills.length > 0 && (
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-[10px] uppercase border-b border-slate-300 pb-0.5 tracking-wider text-slate-900">
                  Skills & Technical Frameworks
                </h2>
                <p className="text-[10px] leading-relaxed text-slate-700">
                  {skills.join(', ')}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-[10px] uppercase border-b border-slate-300 pb-0.5 tracking-wider text-slate-900">
                Certifications & Other Details
              </h2>
              <div className="text-[10px] leading-relaxed text-slate-700">
                {certifications && certifications.map((c) => (
                  <div key={c.id}>• {c.name} ({c.issuer})</div>
                ))}
                {languages && languages.length > 0 && (
                  <div className="mt-1">
                    <strong>Languages:</strong> {languages.map(l => `${l.name} (${l.proficiency})`).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TEMPLATE 4: GOOGLE INSPIRED (TECHNICAL SPECIALIST) ----------------- */}
      {templateId === 'google-inspired' && (
        <div className="flex flex-col gap-4 text-xs font-mono text-slate-900">
          {/* Header */}
          <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
            <div className="font-sans">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {personalInfo.fullName}
              </h1>
              <p className={`text-sm font-semibold ${c.text}`}>
                {personalInfo.jobTitle}
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-mono space-y-0.5 leading-none">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.website && <div className="text-indigo-600 hover:underline">{personalInfo.website}</div>}
              {personalInfo.github && <div className="text-indigo-600 hover:underline">{personalInfo.github}</div>}
            </div>
          </div>

          {/* Technical Summary */}
          {summary && (
            <div className="space-y-1">
              <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] block">// PROFESSIONAL SUMMARY</span>
              <p className="font-sans text-xs leading-relaxed text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-150">
                {summary}
              </p>
            </div>
          )}

          {/* Technical Skill Matrix (First for Google resumes) */}
          {skills && skills.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] block">// CORE TECHNOLOGY STACK</span>
              <div className="flex flex-wrap gap-1">
                {skills.map((skill, index) => (
                  <span key={index} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded font-mono text-[10px]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Professional Experience */}
          {workExperiences && workExperiences.length > 0 && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] block">// WORK EXPERIENCE</span>
              <div className="space-y-3">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline font-sans">
                      <span className="font-bold text-slate-900 text-sm">
                        {exp.company} <span className="font-normal text-slate-400">|</span> {exp.position}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 font-sans text-xs">
                      {exp.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] block">// CODE & OPEN-SOURCE PROJECTS</span>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5 font-sans">
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="font-bold text-slate-900 text-xs">{proj.title}</span>
                      <span className="text-[10px] text-slate-400">{proj.link}</span>
                    </div>
                    <p className="text-slate-600 text-xs">{proj.description}</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-xs mt-0.5">
                      {proj.bullets && proj.bullets.map((bul, index) => (
                        <li key={index}>{bul}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education & Certs split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            {educations && educations.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] block">// ACADEMIC BACKGROUND</span>
                {educations.map((edu) => (
                  <div key={edu.id} className="font-sans text-xs">
                    <div className="font-bold text-slate-900">{edu.institution}</div>
                    <div className="text-slate-600">{edu.degree} in {edu.fieldOfStudy}</div>
                    <div className="text-[11px] text-slate-500">GPA: {edu.gpa} | {formatDate(edu.startDate)} - {formatDate(edu.endDate)}</div>
                  </div>
                ))}
              </div>
            )}
            {certifications && certifications.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] block">// CERTIFICATIONS</span>
                <ul className="list-disc pl-4 space-y-1 font-sans text-xs text-slate-600">
                  {certifications.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold text-slate-800">{c.name}</span> ({c.issuer})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TEMPLATE 5: EXECUTIVE MODERN (SLEEK MODERN WITH SIDE METADATA) ----------------- */}
      {templateId === 'executive-modern' && (
        <div className="flex flex-col gap-5 text-sm">
          {/* Header banner */}
          <div className="bg-slate-900 text-white p-6 -mx-8 -mt-8 sm:-mx-10 sm:-mt-10 md:-mx-12 md:-mt-12 mb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {personalInfo.fullName}
                </h1>
                <p className="text-sm font-semibold text-indigo-400 mt-1 uppercase tracking-wider">
                  {personalInfo.jobTitle}
                </p>
              </div>
              <div className="text-slate-300 text-xs space-y-1 text-left sm:text-right">
                {personalInfo.location && <div className="flex items-center sm:justify-end gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-400" />{personalInfo.location}</div>}
                {personalInfo.email && <div className="flex items-center sm:justify-end gap-1"><Mail className="w-3.5 h-3.5 text-indigo-400" />{personalInfo.email}</div>}
                {personalInfo.phone && <div className="flex items-center sm:justify-end gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" />{personalInfo.phone}</div>}
                {(personalInfo.website || personalInfo.linkedin) && (
                  <div className="text-indigo-300">
                    {personalInfo.website && <span className="mr-2">{personalInfo.website}</span>}
                    {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="border-l-4 border-indigo-500 pl-4 py-1 text-slate-700 italic">
              <p className={s.textBase}>{summary}</p>
            </div>
          )}

          {/* Split main content & side section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Main Experiences and Projects */}
            <div className="md:col-span-2 flex flex-col gap-5">
              
              {workExperiences && workExperiences.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs"></span>
                    Professional History
                  </h2>
                  <div className="flex flex-col gap-4">
                    {workExperiences.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">{exp.position}</h3>
                            <span className="text-xs font-semibold text-indigo-600">{exp.company}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-bold whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                          </span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 text-xs">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projects && projects.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs"></span>
                    Selected Projects
                  </h2>
                  <div className="space-y-3">
                    {projects.map((p) => (
                      <div key={p.id} className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 text-sm">{p.title}</h3>
                        <p className="text-xs text-slate-600 leading-normal">{p.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.technologies.map((tech, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Col: Education, Skills, and Certs */}
            <div className="md:col-span-1 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-slate-200 md:pl-5 pt-4 md:pt-0">
              
              {skills && skills.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1">
                    Areas of Expertise
                  </h2>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((skill, index) => (
                      <span key={index} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {educations && educations.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1">
                    Academic History
                  </h2>
                  <div className="space-y-3">
                    {educations.map((edu) => (
                      <div key={edu.id} className="space-y-0.5 text-xs">
                        <div className="font-extrabold text-slate-800">{edu.institution}</div>
                        <div className="text-indigo-600 font-medium">{edu.degree}</div>
                        <div className="text-slate-500 font-medium">{edu.fieldOfStudy}</div>
                        <div className="text-[11px] text-slate-400">GPA: {edu.gpa} | {formatDate(edu.startDate)} - {formatDate(edu.endDate)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {certifications && certifications.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1">
                    Credentials
                  </h2>
                  <div className="space-y-2 text-xs text-slate-600">
                    {certifications.map((c) => (
                      <div key={c.id}>
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-slate-400 text-[10px]">{c.issuer} ({formatDate(c.date)})</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ----------------- TEMPLATE 6: GRADUATE ENTRY (ACADEMIC FOCUS) ----------------- */}
      {templateId === 'graduate-entry' && (
        <div className="flex flex-col gap-4 text-xs text-slate-800">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase">
              {personalInfo.fullName}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 italic">
              Candidate for {personalInfo.jobTitle || 'Graduate Program'}
            </p>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5 font-medium">
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.email && <span>• {personalInfo.email}</span>}
              {personalInfo.github && <span>• {personalInfo.github}</span>}
              {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
            </div>
          </div>

          {/* Education first */}
          {educations && educations.length > 0 && (
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-900 border-b border-slate-300 pb-0.5">Education</h2>
              <div className="space-y-2 pt-1">
                {educations.map((edu) => (
                  <div key={edu.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline font-bold">
                      <span className="text-sm text-slate-900">{edu.institution}</span>
                      <span className="text-slate-500 font-semibold">{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 italic">
                      <span>{edu.degree} in {edu.fieldOfStudy}</span>
                      <span className="font-bold">GPA: {edu.gpa || 'N/A'}</span>
                    </div>
                    {edu.description && <p className="text-slate-500 italic">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Projects / Courses */}
          {projects && projects.length > 0 && (
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-900 border-b border-slate-300 pb-0.5">Featured Academic Projects</h2>
              <div className="space-y-2 pt-1">
                {projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline font-bold">
                      <span className="text-slate-900">{proj.title}</span>
                      <span className="text-indigo-600 font-medium">{proj.link}</span>
                    </div>
                    <p className="text-slate-600 leading-normal">{proj.description}</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      {proj.bullets && proj.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internships & Early Careers */}
          {workExperiences && workExperiences.length > 0 && (
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-900 border-b border-slate-300 pb-0.5">Internship & Leadership Experience</h2>
              <div className="space-y-3 pt-1">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-sm">{exp.company}</span>
                      <span className="text-slate-500 font-semibold">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 italic">
                      <span>{exp.position}</span>
                      <span>{exp.location}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 mt-1">
                      {exp.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Sets */}
          {skills && skills.length > 0 && (
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-900 border-b border-slate-300 pb-0.5">Technical & Interpersonal Skills</h2>
              <div className="flex flex-wrap gap-1 pt-1.5">
                {skills.map((skill, index) => (
                  <span key={index} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-sm text-[10px] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Volunteering & Extra Curriculars */}
          {volunteering && volunteering.length > 0 && (
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-900 border-b border-slate-300 pb-0.5">Volunteering & Activities</h2>
              <div className="space-y-1.5 pt-1">
                {volunteering.map((v) => (
                  <div key={v.id} className="text-xs">
                    <strong>{v.role}</strong> at {v.organization} ({formatDate(v.startDate)} – {formatDate(v.endDate)})
                    <p className="text-slate-600">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
