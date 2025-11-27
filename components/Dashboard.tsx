
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, ComposedChart, Line
} from 'recharts';
import { FinancialContext, Language } from '../types';
import { formatCurrency } from '../services/mockFirebaseService';
import MetricCard from './MetricCard';
import { Wallet, Flame, ShieldAlert, CalendarClock } from 'lucide-react';
import { getTranslation } from '../translations';

interface DashboardProps {
  data: FinancialContext;
  lang: Language;
  isDark?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, lang, isDark = true }) => {
  const [timeRange, setTimeRange] = useState<number>(6); 
  const t = (key: any) => getTranslation(lang, key);
  const locale = lang === 'es' ? 'es-MX' : 'en-US';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded shadow-xl text-xs z-50">
          <p className="text-slate-700 dark:text-slate-300 font-bold mb-1">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value, locale)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Ensure data is sliced according to range selected, taking from the END (most recent)
  const slicedData = data.monthlyData.slice(-timeRange - 1); 

  const projectionData = slicedData.map((d, i) => ({
    ...d,
    riskThreshold: data.riskThreshold,
  }));

  const maxMonthlySpend = Math.max(0, data.safeToSpend / (data.runwayMonths || 1));

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-20">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard 
          title={t('cashOnHand')}
          value={formatCurrency(data.currentCash, locale)} 
          change={data.recentTransactions.length > 0 ? "-5.2%" : "0%"} 
          trend={data.recentTransactions.length > 0 ? "down" : "neutral"}
          icon={<Wallet className="w-5 h-5" />}
          colorClass="text-slate-900 dark:text-slate-100"
          tooltip={t('tooltipCash')}
        />
        <MetricCard 
          title={t('safeToSpend')} 
          value={formatCurrency(maxMonthlySpend, locale)} 
          trend={maxMonthlySpend > 0 ? "up" : "down"}
          icon={<ShieldAlert className="w-5 h-5" />}
          colorClass={maxMonthlySpend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}
          tooltip={t('tooltipSafe')}
        />
        <MetricCard 
          title={t('upcomingExpenses')}
          value={data.upcomingExpenses.length.toString()} 
          change={formatCurrency(data.upcomingExpenses.reduce((a, b) => a + b.amount, 0), locale)}
          trend="neutral"
          icon={<CalendarClock className="w-5 h-5" />}
          colorClass="text-orange-500 dark:text-orange-400"
          tooltip={t('tooltipUpcoming')}
        />
        <MetricCard 
          title={t('monthlyBurn')}
          value={formatCurrency(data.monthlyBurn, locale)}
          change={data.monthlyBurn > 0 ? "-2.1%" : "0%"}
          trend="down"
          icon={<Flame className="w-5 h-5" />}
          colorClass="text-rose-500 dark:text-rose-400"
          tooltip={t('tooltipBurn')}
        />
      </div>

      {/* Upcoming Expenses Alert */}
      {data.upcomingExpenses.length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 border border-orange-200 dark:border-orange-500/30 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
              <CalendarClock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-slate-800 dark:text-slate-200 font-medium text-sm">{t('upcomingExpenses')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Total: {formatCurrency(data.upcomingExpenses.reduce((a,b) => a + b.amount, 0), locale)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto max-w-full pb-1 md:pb-0">
            {data.upcomingExpenses.slice(0, 3).map(tx => (
              <div key={tx.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg min-w-[140px]">
                <p className="text-slate-700 dark:text-slate-300 text-xs truncate font-medium">{tx.description}</p>
                <div className="flex justify-between mt-1 text-[10px]">
                  <span className="text-slate-500">{tx.nextDueDate}</span>
                  <span className="text-rose-500 dark:text-rose-400">{formatCurrency(tx.amount, locale)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Projection */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-lg relative">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{t('cashFlowProj')}</h3>
             <select 
               className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded px-2 py-1 outline-none"
               value={timeRange}
               onChange={(e) => setTimeRange(Number(e.target.value))}
             >
               <option value={3}>3 {t('months')}</option>
               <option value={6}>6 {t('months')}</option>
               <option value={12}>12 {t('months')}</option>
             </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projectionData}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="month" tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                
                <ReferenceLine y={data.riskThreshold} label={t('riskZone')} stroke="#ef4444" strokeDasharray="3 3" />
                
                <Bar dataKey="burnRate" name={t('monthlyBurn')} fill="#f43f5e" opacity={0.4} barSize={20} />
                
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="none" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" name="Total Expenses" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Activity Summary (Mini) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-lg">
          <h3 className="text-slate-700 dark:text-slate-300 font-semibold mb-4 text-sm">{t('recentActivity')}</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {data.recentTransactions.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">{t('noData')}</div>
            )}
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 pb-3 last:border-0">
                <div className="flex flex-col">
                  <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">{tx.description}</span>
                  <span className="text-slate-500 text-[10px]">{tx.date} • {tx.category?.name || 'General'}</span>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
