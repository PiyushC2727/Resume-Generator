import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, AlertCircle, Bot, User, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onSendMessage: (message: string) => Promise<{ explanation?: string }>;
  isAILoading: boolean;
  onApplyPrompt: (prompt: string) => void;
}

export default function AIAssistant({ onSendMessage, isAILoading, onApplyPrompt }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Hello! I am your AI Career Coach and Resume Expert. I can rewrite, expand, or optimize your resume in real time. Just ask me to 'Add my AWS certification', 'Improve my summary', 'Make it Google Style', or 'Proofread and fix grammar'. How can I help you level up your CV today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggestion chips
  const suggestionChips = [
    "Make my work bullets more metric-driven",
    "Tailor my summary for high leadership impact",
    "Enhance technical action verbs across all sections",
    "Format everything to be extremely ATS-friendly",
    "Proofread CV and fix grammatical style errors"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || isAILoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    try {
      const response = await onSendMessage(text);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: response.explanation || "I have successfully processed your request and updated your resume in real time! You can see the updated text in the live preview panel on the right.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: `Sorry, I encountered an issue: ${err.message || 'Could not parse response.'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAILoading]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 text-xs sm:text-sm">AI Career Coach Chat</h3>
            <p className="text-[10px] text-slate-500 font-medium">Real-time resume state editor</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-150">
          <Sparkles className="w-3 h-3 animate-pulse" /> Active
        </span>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-2.5 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.sender === 'user' 
                ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble */}
            <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed font-sans ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              {msg.text}
              <div className={`text-[9px] mt-1.5 text-right font-medium ${
                msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isAILoading && (
          <div className="flex gap-2.5 max-w-[80%]">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-50 text-slate-500 rounded-2xl rounded-tl-none p-3.5 text-xs sm:text-sm border border-slate-200 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span>Re-engineering resume state...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips Box */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Coach Presets:</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {suggestionChips.map((chip, index) => (
            <button
              key={index}
              onClick={() => handleSend(chip)}
              disabled={isAILoading}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 text-[10px] font-semibold rounded-lg shrink-0 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
        className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me to modify anything (e.g. 'Add a new project...')"
          className="flex-1 text-xs p-3 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl font-sans"
          disabled={isAILoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isAILoading}
          className="p-2.5 bg-indigo-600 disabled:bg-slate-100 text-white disabled:text-slate-350 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
