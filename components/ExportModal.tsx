
import React, { useState, useMemo } from 'react';
import { ExportFormat, ExportPeriod, exportData } from '../services/exportService';
import { Transaction, Account, Category } from '../types';

interface ExportModalProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ transactions, accounts, categories, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [period, setPeriod] = useState<ExportPeriod>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(getLocalDateString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const yearsGrid = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days: { date: string, day: number, isCurrentMonth: boolean }[] = [];
    
    for (let i = startOffset; i > 0; i--) {
      const d = daysInPrevMonth - i + 1;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({ date: `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`, day: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`, day: i, isCurrentMonth: true });
    }
    const remaining = 35 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({ date: `${y}-${(m + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`, day: i, isCurrentMonth: false });
    }
    return days;
  }, [viewDate]);

  const handleExport = async () => {
    setIsExporting(true);
    let dateValue = "";
    if (period === 'daily') dateValue = selectedDay;
    if (period === 'weekly') dateValue = selectedDay; 
    if (period === 'monthly') dateValue = `${selectedMonthYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    if (period === 'yearly') dateValue = selectedYear.toString();
    if (period === 'all') dateValue = "all";

    try {
      await exportData(transactions, accounts, categories, { format, period, dateValue });
      onClose();
    } catch (err) {
      alert("Export Failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const labelClass = "text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 block ml-1";
  const selectClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white appearance-none cursor-pointer focus:border-[#4285F4]/40 focus:bg-white/[0.08] outline-none transition-all";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ animation: 'fadeIn 0.4s ease-out' }}
    >
      <div className="glass w-full max-w-2xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden" 
           style={{ animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Animated Background Pulse */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4285F4]/10 blur-[100px] rounded-full animate-pulse pointer-events-none"></div>

        {/* Header - High-end style */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <i className="fa-solid fa-file-export text-[#4285F4] text-xs"></i>
               <h3 className="text-2xl font-black text-white tracking-tighter">Export Data</h3>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Download your transactions</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl glass text-gray-400 hover:text-white flex items-center justify-center transition-all hover:rotate-90">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10 relative z-10">
          
          {/* Format Section */}
          <section>
            <label className={labelClass}>File Format</label>
            <div className="grid grid-cols-4 gap-4">
              {(['pdf', 'csv', 'xlsx', 'json'] as ExportFormat[]).map((f) => (
                <button
                  key={f} onClick={() => setFormat(f)}
                  className={`py-6 rounded-3xl border transition-all flex flex-col items-center gap-3 shine-hover ${format === f ? 'bg-[#4285F4]/20 border-[#4285F4] text-white shadow-[0_0_20px_rgba(66,133,244,0.3)]' : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]'}`}
                >
                  <i className={`fa-solid ${f === 'pdf' ? 'fa-file-pdf' : f === 'csv' ? 'fa-file-csv' : f === 'xlsx' ? 'fa-file-excel' : 'fa-database'} text-2xl`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Period Selection */}
          <section>
            <label className={labelClass}>Time Period</label>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
              {(['daily', 'weekly', 'monthly', 'yearly'] as ExportPeriod[]).map((p) => (
                <button
                  key={p} onClick={() => setPeriod(p)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${period === p ? 'bg-[#4285F4] text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Date Selection */}
          <div className="pt-2">
            {(period === 'daily' || period === 'weekly') && (
              <section className="glass p-6 rounded-[32px] border border-white/10">
                 <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                      <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <h5 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                      {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </h5>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                 </div>
                 <div className="grid grid-cols-7 gap-2 text-center mb-4">
                   {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d} className="text-[10px] font-black text-gray-600">{d}</div>)}
                 </div>
                 <div className="grid grid-cols-7 gap-2">
                   {calendarDays.map((d, idx) => (
                     <button
                       key={idx} onClick={() => setSelectedDay(d.date)}
                       className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${selectedDay === d.date ? 'bg-[#4285F4] text-white shadow-[0_0_15px_rgba(66,133,244,0.5)]' : d.isCurrentMonth ? 'text-gray-400 hover:bg-white/10' : 'text-gray-800'}`}
                     >
                       {d.day}
                     </button>
                   ))}
                 </div>
              </section>
            )}

            {period === 'monthly' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Month</label>
                  <div className="relative">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className={selectClass}>
                      {months.map((m, i) => <option key={i} value={i} className="bg-[#1e1e1e]">{m}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Year</label>
                  <div className="relative">
                    <select value={selectedMonthYear} onChange={(e) => setSelectedMonthYear(parseInt(e.target.value))} className={selectClass}>
                      {yearsGrid.map(y => <option key={y} value={y} className="bg-[#1e1e1e]">{y}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
                  </div>
                </div>
              </div>
            )}

            {period === 'yearly' && (
              <div className="grid grid-cols-3 gap-4">
                {yearsGrid.map(y => (
                  <button
                    key={y} onClick={() => setSelectedYear(y)}
                    className={`py-4 rounded-2xl border text-xs font-black uppercase transition-all ${selectedYear === y ? 'bg-[#4285F4] text-white border-[#4285F4] shadow-[0_0_20px_rgba(66,133,244,0.3)]' : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-6">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.4em] btn-primary-glow shine-hover shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isExporting ? <i className="fa-solid fa-satellite animate-pulse"></i> : <i className="fa-solid fa-paper-plane"></i>}
              {isExporting ? 'Downloading...' : 'Download Report'}
            </button>
            <p className="center text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-4 opacity-50">Your data is kept safe and private</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

export default ExportModal;
