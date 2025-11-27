
import React, { useState, useEffect } from 'react';
import { Transaction, Language } from '../types';
import { filterTransactions, formatCurrency, getUniqueCategories } from '../services/mockFirebaseService';
import { ArrowUpRight, ArrowDownRight, Calendar, Search } from 'lucide-react';
import { getTranslation } from '../translations';

interface ActivityLogProps {
  lang: Language;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: 'all' as any,
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    category: 'all',
    search: ''
  });

  useEffect(() => {
    setAvailableCategories(getUniqueCategories());
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    const data = await filterTransactions({
      type: filters.type,
      minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      category: filters.category,
      search: filters.search
    });
    setTransactions(data);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col gap-4 shadow-sm">
        
        {/* Row 1: Search and Main Type */}
        <div className="flex flex-col md:flex-row gap-3">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
                type="text"
                placeholder={t('searchPlaceholder')}
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
             />
           </div>
           <select 
            value={filters.type}
            onChange={e => setFilters({...filters, type: e.target.value})}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
           >
            <option value="all">{t('all')}</option>
            <option value="income">{t('income')}</option>
            <option value="expense">{t('expense')}</option>
          </select>
          <select 
            value={filters.category}
            onChange={e => setFilters({...filters, category: e.target.value})}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
           >
            <option value="all">{t('allCategories')}</option>
            {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Date and Amount */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input 
            type="date"
            value={filters.startDate}
            onChange={e => setFilters({...filters, startDate: e.target.value})}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
          />
          
          <input 
             type="date"
             value={filters.endDate}
             onChange={e => setFilters({...filters, endDate: e.target.value})}
             className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
          />

          <input 
            type="number"
            placeholder={t('min')}
            value={filters.minAmount}
            onChange={e => setFilters({...filters, minAmount: e.target.value})}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
          />

          <input 
             type="number"
             placeholder={t('max')}
             value={filters.maxAmount}
             onChange={e => setFilters({...filters, maxAmount: e.target.value})}
             className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-semibold text-slate-700 dark:text-slate-300">
          {t('recentActivity')} ({transactions.length})
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-1">
          {transactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              {t('noData')}
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                       tx.type === 'income' 
                       ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' 
                       : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'
                   }`}>
                     {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                   </div>
                   <div>
                     <p className="text-slate-800 dark:text-slate-200 font-medium">{tx.description}</p>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <Calendar className="w-3 h-3" /> {tx.date}
                       <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full"></span>
                       <span>{tx.category?.name || 'Uncategorized'}</span>
                       {tx.expenseType && (
                         <>
                           <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full"></span>
                           <span className="capitalize">{tx.expenseType}</span>
                         </>
                       )}
                     </div>
                   </div>
                </div>
                <div className="text-right">
                  <span className={`block font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, locale)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
