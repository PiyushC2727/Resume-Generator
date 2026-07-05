import { ResumeData } from '../types';

/**
 * Escapes special LaTeX characters to prevent compilation errors.
 */
export function escapeLatex(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/#/g, '\\#');
}

/**
 * Programmatic LaTeX code generator supporting all templates, spacings, and colors.
 */
export function generateResumeLaTeX(
  data: ResumeData,
  templateId: string,
  colorAccent: string,
  spacing: 'compact' | 'standard' | 'spacious'
): string {
  const { personalInfo, summary, workExperiences, educations, projects, skills, certifications, languages, volunteering, awards } = data;

  // 1. Color Accent Mapping
  const colors: Record<string, string> = {
    indigo: '4F46E5', // #4f46e5
    slate: '334155',  // #334155
    emerald: '059669',// #059669
    rose: 'E11D48',   // #e11d48
    sky: '0284C7',    // #0284c7
    amber: 'D97706',  // #d97706
  };
  const hexColor = colors[colorAccent] || colors.indigo;

  // 2. Spacing Margin Mapping
  const margins = {
    compact: '0.40in',
    standard: '0.50in',
    spacious: '0.65in',
  }[spacing] || '0.50in';

  // 3. Spacing Vertical Adjustments
  const vspaces = {
    compact: { section: '-6pt', item: '-6pt', list: '-5pt', preBullet: '-4pt' },
    standard: { section: '-3pt', item: '-3pt', list: '-2pt', preBullet: '-2pt' },
    spacious: { section: '0pt', item: '0pt', list: '2pt', preBullet: '0pt' },
  }[spacing] || { section: '-3pt', item: '-3pt', list: '-2pt', preBullet: '-2pt' };

  // 4. Serif vs Sans-Serif Font Selection
  const fontCommand = templateId === 'mckinsey' 
    ? '% Use serif typeface\n\\usepackage{charter}' 
    : '% Use sans-serif typeface\n\\usepackage[sfdefault]{FiraSans}\n\\renewcommand{\\familydefault}{\\sfdefault}';

  // 5. Structure Elements based on Template ordering
  const name = escapeLatex(personalInfo.fullName);
  const title = escapeLatex(personalInfo.jobTitle);
  const email = escapeLatex(personalInfo.email);
  const phone = escapeLatex(personalInfo.phone);
  const location = escapeLatex(personalInfo.location);
  const website = escapeLatex(personalInfo.website);
  const linkedin = escapeLatex(personalInfo.linkedin);
  const github = escapeLatex(personalInfo.github);

  // LaTeX Sections Generators
  const getHeaderSection = () => {
    if (templateId === 'executive-modern') {
      return `
% --- EXECUTIVE HEADER ---
\\begin{tabular*}{1.0\\textwidth}{l@{\\extracolsep{\\fill}}r}
  \\textbf{\\Huge \\color{accentColor} ${name.toUpperCase()}} & \\small ${phone} $|$ \\href{mailto:${email}}{${email}} \\\\
  \\large \\textit{${title}} & \\small ${location} $|$ \\href{https://${linkedin}}{LinkedIn} $|$ \\href{https://${github}}{GitHub}
\\end{tabular*}
\\vspace{10pt}
`;
    }
    
    // Default Centered Header
    return `
% --- CENTERED HEADER ---
\\begin{center}
  {\\Huge \\textbf{\\scshape \\color{accentColor} ${name}}} \\\\ \\vspace{3pt}
  \\large \\textit{${title}} \\\\ \\vspace{4pt}
  \\small ${phone} $|$ \\href{mailto:${email}}{${email}} 
  ${location ? ` $|$ ${location}` : ''}
  ${website ? ` $|$ \\href{https://${website}}{Portfolio}` : ''}
  ${linkedin ? ` $|$ \\href{https://${linkedin}}{LinkedIn}` : ''}
  ${github ? ` $|$ \\href{https://${github}}{GitHub}` : ''}
\\end{center}
`;
  };

  const getSummarySection = () => {
    if (!summary) return '';
    return `
% --- PROFESSIONAL SUMMARY ---
\\section{Professional Summary}
${escapeLatex(summary)}
`;
  };

  const getExperienceSection = () => {
    if (!workExperiences || workExperiences.length === 0) return '';
    return `
% --- EXPERIENCE ---
\\section{Professional Experience}
\\begin{itemize}[leftmargin=0.15in, label={}]
${workExperiences.map(exp => `
  \\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{${escapeLatex(exp.position)}} & \\small ${escapeLatex(exp.startDate)} -- ${exp.isCurrent ? 'Present' : escapeLatex(exp.endDate)} \\\\
      \\textit{\\color{accentColor} ${escapeLatex(exp.company)}} & \\small \\textit{${escapeLatex(exp.location)}} \\\\
    \\end{tabular*}\\\\ \\vspace{${vspaces.preBullet}}
    \\begin{itemize}[leftmargin=0.15in]
      ${exp.bullets.map(b => `\\item ${escapeLatex(b)}`).join('\n      ')}
    \\end{itemize}
`).join(`\\vspace{${vspaces.item}}\n`)}
\\end{itemize}
`;
  };

  const getEducationSection = () => {
    if (!educations || educations.length === 0) return '';
    return `
% --- EDUCATION ---
\\section{Education}
\\begin{itemize}[leftmargin=0.15in, label={}]
${educations.map(edu => `
  \\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{${escapeLatex(edu.degree)} in ${escapeLatex(edu.fieldOfStudy)}} & \\small ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)} \\\\
      \\textit{${escapeLatex(edu.institution)}} & \\small \\textit{${escapeLatex(edu.location)}} ${edu.gpa ? ` $|$ GPA: ${escapeLatex(edu.gpa)}` : ''} \\\\
    \\end{tabular*}
    ${edu.description ? `\\\\ \\small \\textit{${escapeLatex(edu.description)}}` : ''}
`).join(`\\vspace{${vspaces.item}}\n`)}
\\end{itemize}
`;
  };

  const getProjectsSection = () => {
    if (!projects || projects.length === 0) return '';
    return `
% --- PROJECTS ---
\\section{Featured Projects}
\\begin{itemize}[leftmargin=0.15in, label={}]
${projects.map(proj => `
  \\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{${escapeLatex(proj.title)}} ${proj.technologies && proj.technologies.length > 0 ? ` $|$ \\textit{${proj.technologies.map(t => escapeLatex(t)).join(', ')}}` : ''} & 
      \\small ${proj.link ? `\\href{https://${proj.link}}{Project Link}` : ''} \\\\
    \\end{tabular*}\\\\ \\vspace{${vspaces.preBullet}}
    ${proj.bullets && proj.bullets.length > 0 
      ? `\\begin{itemize}[leftmargin=0.15in]
          ${proj.bullets.map(b => `\\item ${escapeLatex(b)}`).join('\n          ')}
        \\end{itemize}`
      : `\\small ${escapeLatex(proj.description)}`
    }
`).join(`\\vspace{${vspaces.item}}\n`)}
\\end{itemize}
`;
  };

  const getSkillsSection = () => {
    if (!skills || skills.length === 0) return '';
    return `
% --- SKILLS ---
\\section{Core Skills \\& Expertise}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{
    ${skills.map(s => `\\textbf{${escapeLatex(s)}}`).join(' $\\bullet$ ')}
  }}
\\end{itemize}
`;
  };

  const getExtraSections = () => {
    let sections = '';
    
    // Certifications
    if (certifications && certifications.length > 0) {
      sections += `
% --- CERTIFICATIONS ---
\\section{Certifications}
\\begin{itemize}[leftmargin=0.15in, label={}]
${certifications.map(cert => `
  \\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{${escapeLatex(cert.name)}} & \\small ${escapeLatex(cert.date)} \\\\
      \\textit{Issued by ${escapeLatex(cert.issuer)}} & \\small ${cert.link ? `\\href{https://${cert.link}}{Credential Link}` : ''} \\\\
    \\end{tabular*}
`).join(`\\vspace{${vspaces.item}}\n`)}
\\end{itemize}
`;
    }

    // Volunteering
    if (volunteering && volunteering.length > 0) {
      sections += `
% --- VOLUNTEERING ---
\\section{Volunteering \\& Community}
\\begin{itemize}[leftmargin=0.15in, label={}]
${volunteering.map(vol => `
  \\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{${escapeLatex(vol.role)}} & \\small ${escapeLatex(vol.startDate)} -- ${vol.endDate ? escapeLatex(vol.endDate) : 'Present'} \\\\
      \\textit{${escapeLatex(vol.organization)}} & \\\\
    \\end{tabular*}\\\\
    \\small ${escapeLatex(vol.description)}
`).join(`\\vspace{${vspaces.item}}\n`)}
\\end{itemize}
`;
    }

    // Languages
    if (languages && languages.length > 0) {
      sections += `
% --- LANGUAGES ---
\\section{Languages}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item{
    ${languages.map(lang => `\\textbf{${escapeLatex(lang.name)}} (${escapeLatex(lang.proficiency)})`).join(', ')}
  }
\\end{itemize}
`;
    }

    // Awards
    if (awards && awards.length > 0) {
      sections += `
% --- AWARDS ---
\\section{Awards \\& Achievements}
\\begin{itemize}[leftmargin=0.15in]
  ${awards.map(aw => `\\item ${escapeLatex(aw)}`).join('\n  ')}
\\end{itemize}
`;
    }

    return sections;
  };

  // Compile layout order depending on template choice
  let bodyContent = '';
  if (templateId === 'google-inspired') {
    // Skills first layout
    bodyContent = `
${getHeaderSection()}
${getSummarySection()}
${getSkillsSection()}
${getExperienceSection()}
${getEducationSection()}
${getProjectsSection()}
${getExtraSections()}
`;
  } else if (templateId === 'graduate-entry') {
    // Education first layout
    bodyContent = `
${getHeaderSection()}
${getSummarySection()}
${getEducationSection()}
${getProjectsSection()}
${getExperienceSection()}
${getSkillsSection()}
${getExtraSections()}
`;
  } else {
    // Standard Silicon Valley / McKinsey / Goldman Sachs layout
    bodyContent = `
${getHeaderSection()}
${getSummarySection()}
${getExperienceSection()}
${getSkillsSection()}
${getEducationSection()}
${getProjectsSection()}
${getExtraSections()}
`;
  }

  // Returns complete formatted document
  return `\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{xcolor}

${fontCommand}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-${margins}}
\\addtolength{\\evensidemargin}{-${margins}}
\\addtolength{\\textwidth}{2\\oddsidemargin * -1}
\\addtolength{\\topmargin}{-${margins}}
\\addtolength{\\textheight}{2\\topmargin * -1}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Define Theme Color
\\definecolor{accentColor}{HTML}{${hexColor}}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{${vspaces.section}}\\scshape\\raggedright\\large\\bfseries\\color{accentColor}
}{}{0em}{}[\\color{accentColor}\\titlerule \\vspace{${vspaces.list}}]

\\begin{document}
${bodyContent}
\\end{document}
`;
}
