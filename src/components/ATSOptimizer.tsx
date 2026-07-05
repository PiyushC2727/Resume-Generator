import React, { useState } from 'react';
import { ATSAnalysis, ResumeData } from '../types';
import { 
  CheckCircle, AlertTriangle, HelpCircle, 
  Sparkles, RefreshCw, Layers, TrendingUp, Info
} from 'lucide-react';

interface ATSOptimizerProps {
  analysis: ATSAnalysis | null;
  onRunAnalysis: (jobDescription?: string) => Promise<void>;
  onApplyOptimization: () => Promise<void>;
  isAILoading: boolean;
  jobDescription: string;
  onChangeJobDescription: (jd: string) => void;
}

export default function ATSOptimizer({ 
  analysis, 
  onRunAnalysis, 
  onApplyOptimization, 
  isAILoading,
  jobDescription,
  onChangeJobDescription
}: ATSOptimizerProps) {

  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-600', border: 'border-emerald-500', bg: 'bg-emerald-50' };
    if (score >= 70) return { text: 'text-amber-600', border: 'border-amber-500', bg: 'bg-amber-50' };
    return { text: 'text-rose-600', border: 'border-rose-500', bg: 'bg-rose-50' };
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Highly competitive! Ready for submissions at top-tier FAANG/IB institutions.';
    if (score >= 75) return 'Good foundation, but lacks necessary metrics and direct job description keywords.';
    return 'High rejection risk. Crucial skills and standard recruiter formatting rules are missing.';
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 text-xs sm:text-sm">ATS Optimizer & Gap Analyzer</h3>
            <p className="text-[10px] text-slate-500 font-medium font-sans">Maximize resume compatibility score</p>
          </div>
        </div>
      </div>

      {/* Main panel content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Run Initial Trigger or Active Analysis */}
        {!analysis ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="font-extrabold text-slate-950 text-sm">Review & Grade Your CV</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our advanced ATS scanner processes formatting structure, action-oriented syntax density, metric compliance, and keyword overlap to predict your HR interview invitation rate.
              </p>
            </div>
            
            {/* Optional job description box */}
            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Target specific job description? (Highly recommended)</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => onChangeJobDescription(e.target.value)}
                placeholder="Paste the target job posting / requirements here..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => onRunAnalysis(jobDescription)}
              disabled={isAILoading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isAILoading ? 'animate-spin' : ''}`} />
              {isAILoading ? 'Scanning CV...' : 'Run ATS Expert Evaluation'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Score circle & details */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {/* Circular Gauge */}
              <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreColor(analysis.score).border} ${getScoreColor(analysis.score).bg}`}>
                <span className="text-3xl font-mono font-extrabold text-slate-900">{analysis.score}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ATS SCORE</span>
              </div>
              
              <div className="space-y-1 text-center sm:text-left">
                <h4 className={`text-sm font-extrabold uppercase tracking-wide ${getScoreColor(analysis.score).text}`}>
                  {analysis.score >= 90 ? 'ATS Elite Status' : analysis.score >= 70 ? 'Intermediate Level' : 'Critically Unoptimized'}
                </h4>
                <p className="text-xs text-slate-600 leading-normal">
                  {getScoreDescription(analysis.score)}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                  <button
                    onClick={() => onRunAnalysis(jobDescription)}
                    disabled={isAILoading}
                    className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-scan Resume
                  </button>
                  <button
                    onClick={onApplyOptimization}
                    disabled={isAILoading}
                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-3xs"
                  >
                    <Sparkles className="w-3 h-3 animate-pulse" /> Auto-Optimize CV
                  </button>
                </div>
              </div>
            </div>

            {/* Active Job Description Input */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Target Job Description</span>
              <textarea
                value={jobDescription}
                onChange={(e) => onChangeJobDescription(e.target.value)}
                placeholder="Paste new target job requirements here to re-scan..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-none font-sans"
              />
            </div>

            {/* Resume Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">✓ Recruiter Highlights</span>
                <ul className="space-y-1.5">
                  {analysis.strengthAnalysis.map((str, idx) => (
                    <li key={idx} className="flex gap-1.5 text-xs text-slate-700 leading-normal">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">✗ Improvement Areas</span>
                <ul className="space-y-1.5">
                  {analysis.weaknessAnalysis.map((weak, idx) => (
                    <li key={idx} className="flex gap-1.5 text-xs text-slate-700 leading-normal">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Skills and Keyword gaps */}
            {(analysis.missingSkills.length > 0 || analysis.keywordGaps.length > 0) && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900">Keyword & Skill Gap Mapping</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.missingSkills.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Missing Core Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {analysis.missingSkills.map((skill, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-250 px-2 py-0.5 rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.keywordGaps.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">ATS Target Keywords</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {analysis.keywordGaps.map((word, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-250 px-2 py-0.5 rounded-md">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verb suggestions */}
            {analysis.verbSuggestions && analysis.verbSuggestions.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Recommended Action Verbs</span>
                <div className="space-y-2">
                  {analysis.verbSuggestions.map((vs, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-slate-400 font-medium">{vs.original}</span>
                          <span className="font-bold text-slate-500">→</span>
                          <span className="font-extrabold text-indigo-700">{vs.suggested}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{vs.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General actionable checklists */}
            {analysis.improvementSuggestions.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">How to score 90+</span>
                <ul className="space-y-1">
                  {analysis.improvementSuggestions.map((step, idx) => (
                    <li key={idx} className="flex gap-1.5 text-xs text-slate-600 leading-normal">
                      <span className="text-indigo-500 font-extrabold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
