
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
      alert("Export Failed. Check connection.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0b]/90 backdrop-blur-xl p-4 md:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#121214] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden mobile-sheet animate-page-enter">
        
        {/* Header - Compact */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#121214]/80 backdrop-blur-md z-20">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#d4af37]">Export Vault</h3>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Audit Log Dispatcher</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-lg active:scale-90">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-10">
          
          {/* Format Selection - Compact Grid */}
          <section className="space-y-3">
            <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Format Specification</h4>
            <div className="grid grid-cols-4 gap-2">
              {(['pdf', 'csv', 'xlsx', 'json'] as ExportFormat[]).map((f) => (
                <button
                  key={f} onClick={() => setFormat(f)}
                  className={`py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${format === f ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]' : 'bg-zinc-950 border-white/5 text-zinc-600 hover:text-zinc-400'}`}
                >
                  <i className={`fa-solid ${f === 'pdf' ? 'fa-file-pdf' : f === 'csv' ? 'fa-file-csv' : f === 'xlsx' ? 'fa-file-excel' : 'fa-database'} text-base mb-0.5`}></i>
                  <span className="text-[8px] font-black uppercase tracking-widest">{f}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Periodicity Selector - Slim Tab Bar */}
          <section className="space-y-3">
            <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Reporting Cycle</h4>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
              {(['daily', 'weekly', 'monthly', 'yearly'] as ExportPeriod[]).map((p) => (
                <button
                  key={p} onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${period === p ? 'bg-[#d4af37] text-[#0a0a0b]' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Calendar Picker - Optimized for Landscape Phones */}
          {(period === 'daily' || period === 'weekly') && (
            <section className="bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
               <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-8 h-8 rounded-full bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center transition-colors">
                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  </button>
                  <h5 className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </h5>
                  <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-8 h-8 rounded-full bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center transition-colors">
                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center mb-1">
                 {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d} className="text-[7px] font-black text-zinc-700">{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1">
                 {calendarDays.map((d, idx) => (
                   <button
                     key={idx} onClick={() => setSelectedDay(d.date)}
                     className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${selectedDay === d.date ? 'bg-[#d4af37] text-[#0a0a0b]' : d.isCurrentMonth ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-800 pointer-events-none'}`}
                   >
                     {d.day}
                   </button>
                 ))}
               </div>
            </section>
          )}

          {/* Monthly/Yearly Simplification */}
          {period === 'monthly' && (
            <div className="flex gap-2">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-zinc-400 appearance-none">
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={selectedMonthYear} onChange={(e) => setSelectedMonthYear(parseInt(e.target.value))} className="w-24 bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-zinc-400 appearance-none">
                {yearsGrid.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {period === 'yearly' && (
            <div className="grid grid-cols-3 gap-2">
              {yearsGrid.map(y => (
                <button
                  key={y} onClick={() => setSelectedYear(y)}
                  className={`py-3 rounded-xl border text-[10px] font-black transition-all ${selectedYear === y ? 'bg-[#d4af37] text-[#0a0a0b] border-[#d4af37]' : 'bg-zinc-950 border-white/5 text-zinc-600'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-5 bg-[#d4af37] text-[#0a0a0b] font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isExporting ? <i className="fa-solid fa-gear animate-spin mr-2"></i> : 'Execute Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
