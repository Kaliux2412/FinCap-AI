
import React, { useState } from 'react';
import { TransactionType, ExpenseCategory, Language } from '../types';
import { addTransaction } from '../services/mockFirebaseService';
import { Save, DollarSign, Calendar, FileText, CreditCard } from 'lucide-react';
import { getTranslation } from '../translations';
import LoadingOverlay from './LoadingOverlay';

interface TransactionFormProps {
  type: TransactionType;
  lang: Language;
  onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ type, lang, onSuccess }) => {
  const t = (key: any) => getTranslation(lang, key);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '2025-11-18',
    expenseType: 'variable' as ExpenseCategory,
    isRecurring: false,
    nextDueDate: '',
    installmentsTotal: 0,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate slightly longer process for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    await addTransaction({
      description: formData.description,
      amount: Number(formData.amount),
      // Cast to any: service handles string creation of Category object
      category: (formData.category || (type === 'income' ? 'Sales' : 'General')) as any,
      date: formData.date,
      type: type,
      expenseType: type === 'expense' ? formData.expenseType : undefined,
      isRecurring: formData.isRecurring,
      nextDueDate: formData.isRecurring ? formData.nextDueDate : undefined,
      installments: formData.installmentsTotal > 0 ? { current: 1, total: formData.installmentsTotal } : undefined,
    });

    setLoading(false);
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: '2025-11-18',
      expenseType: 'variable',
      isRecurring: false,
      nextDueDate: '',
      installmentsTotal: 0
    });
    onSuccess();
  };

  return (
    <div className="max-w-2xl mx-auto relative">
      <LoadingOverlay isVisible={loading} message={t('saving')} />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className={`p-3 rounded-lg ${type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {type === 'income' ? t('addIncome') : t('addExpense')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('description')}</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  required
                  type="text" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Client Payment"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('amount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-semibold">$</span>
                <input 
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-8 pr-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-2">
              <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('date')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  required
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('category')}</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Marketing, Sales, etc."
              />
            </div>
          </div>

          {/* Expense Specific Options */}
          {type === 'expense' && (
            <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Options
              </h3>
              
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.isRecurring}
                      onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                      className="peer sr-only" 
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t('recurring')}</span>
                </label>

                {formData.isRecurring && (
                   <div className="ml-12 space-y-2 animate-in slide-in-from-top-2 fade-in">
                     <label className="text-xs text-slate-500 dark:text-slate-400">{t('dueDate')}</label>
                     <input 
                       type="date" 
                       required
                       value={formData.nextDueDate}
                       onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                       className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-sm text-slate-800 dark:text-white w-full"
                     />
                   </div>
                )}

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                 <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.expenseType === 'fixed'}
                    onChange={e => setFormData({...formData, expenseType: e.target.checked ? 'fixed' : 'variable'})}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t('isFixed')}</span>
                </label>

                 <div className="space-y-2 pt-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                     {t('installments')}
                     <span className="text-xs text-slate-500 dark:text-slate-500">(Optional)</span>
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="24"
                    value={formData.installmentsTotal || ''}
                    onChange={e => setFormData({...formData, installmentsTotal: Number(e.target.value)})}
                    placeholder="0"
                    className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white"
                  />
                 </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01]'}
              ${type === 'income' 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-900/20' 
                : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-lg shadow-rose-900/20'
              }
            `}
          >
            <Save className="w-5 h-5" />
            {type === 'income' ? t('createIncomeBtn') : t('createExpenseBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
