import React, { useState } from 'react';
import { PremiumInsights } from '../types';
import { 
  Sparkles, HelpCircle, DollarSign, Compass, RefreshCw, 
  ChevronRight, ArrowUpRight, TrendingUp, Cpu
} from 'lucide-react';

interface PremiumInsightsComponentProps {
  insights: PremiumInsights | null;
  onGenerateInsights: () => Promise<void>;
  isAILoading: boolean;
}

export default function PremiumInsightsComponent({ insights, onGenerateInsights, isAILoading }: PremiumInsightsComponentProps) {
  const [activePanel, setActivePanel] = useState<'interview' | 'salary' | 'career'>('interview');

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Sub tabs */}
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActivePanel('interview')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
            activePanel === 'interview' 
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Prep Questions
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('salary')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
            activePanel === 'salary' 
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Salary Intel
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('career')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
            activePanel === 'career' 
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" /> Career Roadmap
        </button>
      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {!insights ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Compass className="w-7 h-7 animate-pulse" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="font-extrabold text-slate-950 text-sm">Activate Career Coach Module</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Unlock customized interview prep questions based on your work history, target salary intelligence guides, and a targeted roadmap pointing out critical tech gaps to boost your market valuation.
              </p>
            </div>

            <button
              type="button"
              onClick={onGenerateInsights}
              disabled={isAILoading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              {isAILoading ? 'Formulating Career Coaching Insights...' : 'Assemble Career Coach Insights'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* 1. INTERVIEW PREPARATION SCREEN */}
            {activePanel === 'interview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Tailored Interview Challenges</span>
                  <button
                    onClick={onGenerateInsights}
                    disabled={isAILoading}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg cursor-pointer transition-all"
                    title="Refresh Prep"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAILoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {insights.interviewQuestions && insights.interviewQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-all">
                      <div className="flex gap-2 items-start">
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shrink-0">Q{idx + 1}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed font-sans">{q}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SALARY ESTIMATES */}
            {activePanel === 'salary' && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-950">Compensation & Market Value</h4>
                    <p className="text-[11px] text-emerald-900 font-sans leading-normal">
                      Based on your seniority metrics, skills matrix, and career timeline, here is your personalized compensation intelligence summary.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-3">
                  <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">RECRUITER ALIGNED INTEL</div>
                  <p className="whitespace-pre-line text-justify font-sans">{insights.salaryInsights}</p>
                </div>

                <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50 text-xs text-indigo-900 leading-relaxed">
                  <strong>Pro Career Coaching Tip:</strong> Never say "negotiable" or give a specific number first. Let the hiring manager or recruiter offer a baseline first, then state that your unique, quantifiable value matches the top end of the market scale.
                </div>
              </div>
            )}

            {/* 3. FUTURE CAREER PATH ROADMAPS */}
            {activePanel === 'career' && (
              <div className="space-y-5">
                
                {/* Skill Gaps Grid */}
                {insights.skillGapAnalysis && insights.skillGapAnalysis.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Recommended Technology Additions (Skill Gaps)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {insights.skillGapAnalysis.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-amber-50 border border-amber-250 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones timeline */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sequence Promotion Sequence Milestones</span>
                  
                  <div className="space-y-4 pt-1">
                    {insights.careerSuggestions && insights.careerSuggestions.map((sug, idx) => (
                      <div key={idx} className="flex gap-4 items-start relative group">
                        {/* Connection track */}
                        {idx !== insights.careerSuggestions.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-300 transition-all"></div>
                        )}

                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-250 group-hover:border-indigo-500 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 transition-all">
                          {idx + 1}
                        </div>

                        <div className="space-y-1 pb-4 flex-1">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{sug}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
