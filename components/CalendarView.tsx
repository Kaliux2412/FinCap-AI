
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Language, Transaction } from '../types';
import { filterTransactions, formatCurrency } from '../services/mockFirebaseService';
import { getTranslation } from '../translations';

interface CalendarViewProps {
  lang: Language;
}

const CalendarView: React.FC<CalendarViewProps> = ({ lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const localeObj = lang === 'es' ? es : enUS;
  const localeStr = lang === 'es' ? 'es-MX' : 'en-US';
  
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 18));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    
    const data = await filterTransactions({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      type: 'all'
    });
    setTransactions(data);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStats = (day: Date) => {
    const daysTxs = transactions.filter(t => isSameDay(new Date(t.date), day));
    const income = daysTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = daysTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, count: daysTxs.length };
  };

  const selectedTxs = selectedDate 
    ? transactions.filter(t => isSameDay(new Date(t.date), selectedDate)) 
    : [];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg flex flex-col overflow-hidden">
           <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
             <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
               {format(currentMonth, 'MMMM yyyy', { locale: localeObj })}
             </h2>
             <div className="flex items-center gap-2">
               <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                 <ChevronRight className="w-5 h-5" />
               </button>
             </div>
           </div>

           <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
               <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">
                 {d}
               </div>
             ))}
           </div>

           <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
             {calendarDays.map((day, idx) => {
               const stats = getDayStats(day);
               const isSelected = selectedDate && isSameDay(day, selectedDate);
               const isCurrentMonth = isSameMonth(day, monthStart);
               
               return (
                 <div 
                   key={day.toString()}
                   onClick={() => setSelectedDate(day)}
                   className={`
                     min-h-[80px] border-b border-r border-slate-100 dark:border-slate-700/50 p-2 relative cursor-pointer transition-colors
                     ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-800'}
                     ${isSelected ? 'ring-2 ring-inset ring-blue-500 z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                   `}
                 >
                   <span className={`
                     text-xs font-medium p-1 rounded-full w-6 h-6 flex items-center justify-center
                     ${isToday(day) ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400'}
                   `}>
                     {format(day, 'd')}
                   </span>

                   <div className="mt-1 flex flex-col gap-0.5">
                     {stats.income > 0 && (
                       <div className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/20 rounded px-1">
                         <ArrowUpRight className="w-2 h-2 mr-0.5" />
                         {formatCurrency(stats.income, localeStr).split('.')[0]}
                       </div>
                     )}
                     {stats.expense > 0 && (
                       <div className="flex items-center text-[10px] text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-900/20 rounded px-1">
                         <ArrowDownRight className="w-2 h-2 mr-0.5" />
                         {formatCurrency(stats.expense, localeStr).split('.')[0]}
                       </div>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        <div className={`
          w-full md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg flex flex-col overflow-hidden transition-all
          ${selectedDate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 hidden md:flex md:opacity-50'}
        `}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
             <h3 className="font-bold text-slate-800 dark:text-slate-200">
               {selectedDate ? format(selectedDate, 'PPPP', { locale: localeObj }) : t('activity')}
             </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {!selectedDate ? (
               <p className="text-center text-slate-500 mt-10">Select a date to view transactions</p>
             ) : selectedTxs.length === 0 ? (
               <p className="text-center text-slate-500 mt-10">{t('noData')}</p>
             ) : (
               selectedTxs.map(tx => (
                 <div key={tx.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{tx.description}</p>
                        <p className="text-xs text-slate-500">{tx.category?.name || 'General'}</p>
                      </div>
                      <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, localeStr)}
                      </span>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarView;
