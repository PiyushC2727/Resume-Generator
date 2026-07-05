import { ResumeData } from '../types';

export const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Alex Morgan',
    jobTitle: 'Senior Software Engineer',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    website: 'https://alexmorgan.dev',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
  },
  summary: 'Results-driven Senior Software Engineer with 6+ years of experience spearheading full-stack cloud applications. Proven track record of architecting distributed systems, reducing API latency by 40%, and leading cross-functional agile teams. Specialist in TypeScript, React, Node.js, and scalable database solutions.',
  workExperiences: [
    {
      id: 'work-1',
      company: 'TechCorp Solutions',
      position: 'Senior Full-Stack Engineer',
      startDate: '2022-03',
      endDate: 'Present',
      location: 'San Francisco, CA',
      isCurrent: true,
      bullets: [
        'Architected a real-time analytics dashboard using React and Node.js microservices, handling over 10M active daily requests.',
        'Spearheaded the migration of a legacy monolithic application to serverless AWS Lambda infrastructure, reducing annual hosting costs by 28%.',
        'Led a cross-functional squad of 6 engineers to deliver a new collaborative workspace feature, resulting in a 14% increase in user engagement.',
        'Established automated CI/CD pipelines using GitHub Actions, decreasing deployment cycle times from 2 hours to under 15 minutes.'
      ]
    },
    {
      id: 'work-2',
      company: 'InnovateIO Inc',
      position: 'Software Engineer II',
      startDate: '2020-01',
      endDate: '2022-02',
      location: 'Austin, TX',
      isCurrent: false,
      bullets: [
        'Engineered responsive web interfaces using React, TypeScript, and Tailwind CSS, improving mobile conversion rates by 22%.',
        'Designed and optimized relational PostgreSQL database schemas and complex Drizzle ORM queries, achieving a 35% latency reduction in search endpoints.',
        'Collaborated with product and UX design teams to construct a cohesive reusable design system, decreasing developer time-to-market by 30%.',
        'Mentored 3 junior software engineers and conducted thorough code reviews, upholding rigorous standards for code quality and test coverage.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2016-09',
      endDate: '2019-12',
      gpa: '3.82 / 4.0',
      location: 'Berkeley, CA',
      description: 'Graduated with honors. Active member of the Computer Science Undergraduate Association and participant in multiple university hackathons.'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'DevFlow - Developer Community Hub',
      description: 'A modern, high-traffic knowledge sharing platform for software engineers featuring real-time collaborative editing and markdown writing.',
      technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Socket.io', 'MongoDB'],
      link: 'https://devflow-demo.dev',
      bullets: [
        'Engineered a real-time collaborative editing canvas using WebSockets, supporting up to 50 concurrent writers per document.',
        'Implemented full-text search index and advanced tagging filters, speeding up document lookup response times to under 150ms.',
        'Built secure authentication flow and OAuth integrations using NextAuth, protecting personal user profiles.'
      ]
    },
    {
      id: 'proj-2',
      title: 'KubeMonitor - AWS Clustering Suite',
      description: 'An open-source developer tool for monitoring, container health reporting, and telemetry visualizations for cloud clusters.',
      technologies: ['React', 'Node.js', 'AWS CloudWatch', 'Docker', 'Chart.js'],
      link: 'https://kubemonitor.io',
      bullets: [
        'Created elegant real-time charts using D3 and Chart.js to visualize CPU utilization, memory thresholds, and pod orchestration states.',
        'Configured Slack webhooks and SMS alert systems using Twilio API to automatically notify dev squads of critical server events.'
      ]
    }
  ],
  skills: [
    'TypeScript',
    'JavaScript',
    'React',
    'Next.js',
    'Node.js',
    'Express',
    'PostgreSQL',
    'MongoDB',
    'AWS (S3, Lambda, EC2)',
    'Docker',
    'CI/CD Pipelines',
    'Git / GitHub',
    'Tailwind CSS',
    'RESTful APIs',
    'GraphQL',
    'System Architecture',
    'Agile Scrum Methodology'
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2023-08',
      link: 'https://aws.amazon.com/verification'
    },
    {
      id: 'cert-2',
      name: 'Professional Scrum Master I (PSM I)',
      issuer: 'Scrum.org',
      date: '2021-11',
      link: 'https://scrum.org/verify'
    }
  ],
  languages: [
    {
      id: 'lang-1',
      name: 'English',
      proficiency: 'Native / Bilingual'
    },
    {
      id: 'lang-2',
      name: 'Spanish',
      proficiency: 'Professional Working'
    }
  ],
  volunteering: [
    {
      id: 'vol-1',
      organization: 'Code for America',
      role: 'Volunteer Full-Stack Developer',
      startDate: '2021-06',
      endDate: 'Present',
      description: 'Contribute to building open-source civic technology applications designed to help local citizens access critical state services easily.'
    }
  ],
  awards: [
    '1st Place Winner - Bay Area Cloud Hackathon (out of 120 teams) - 2023',
    'Innovator of the Year Award - TechCorp Solutions - 2023',
    'Outstanding Academic Achievement Award - UC Berkeley CS Dept - 2019'
  ]
};
