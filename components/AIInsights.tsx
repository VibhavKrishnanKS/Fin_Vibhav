
import React, { useState, useEffect } from 'react';
import { AIInsight, Transaction, Category } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface AIInsightsProps {
  transactions: Transaction[];
  categories: Category[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, categories }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const data = await getFinancialInsights(transactions, categories);
      setInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'saving': return <i className="fa-solid fa-piggy-bank text-emerald-500"></i>;
      case 'warning': return <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>;
      default: return <i className="fa-solid fa-lightbulb text-blue-500"></i>;
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-8 h-full shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
          AI Coach
        </h4>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-3/4"></div>
              <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-2xl w-full"></div>
            </div>
          ))
        ) : insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-gray-600 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="mt-1 text-xl">
                  {getTypeIcon(insight.type)}
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">{insight.title}</h5>
                  <p className="text-slate-700 dark:text-slate-400 text-[11px] leading-relaxed font-medium">{insight.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 italic text-xs font-bold uppercase tracking-widest">
            Log data to reveal insights
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
