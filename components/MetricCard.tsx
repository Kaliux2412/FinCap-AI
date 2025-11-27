
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string; // e.g. "+12%"
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  colorClass?: string;
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon,
  colorClass = 'text-slate-900 dark:text-slate-100',
  tooltip
}) => {
  return (
    <div className="group flex flex-col justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-lg hover:border-blue-300 dark:hover:border-slate-600 transition-all relative hover:z-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 relative">
           <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
           {tooltip && (
             <div className="relative group/tooltip">
               <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
               {/* Tooltip: Positioned carefully to avoid clipping, higher z-index on the card itself helps */}
               <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700">
                 {tooltip}
               </div>
             </div>
           )}
        </div>
        {icon && <div className="text-slate-500 dark:text-slate-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      </div>

      {change && (
        <div className="mt-3 flex items-center text-xs">
          {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500 dark:text-emerald-400" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1 text-rose-500 dark:text-rose-400" />}
          {trend === 'neutral' && <Minus className="w-3 h-3 mr-1 text-slate-400" />}
          
          <span className={`
            font-medium
            ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : ''}
            ${trend === 'down' ? 'text-rose-600 dark:text-rose-400' : ''}
            ${trend === 'neutral' ? 'text-slate-500 dark:text-slate-400' : ''}
          `}>
            {change}
          </span>
          <span className="text-slate-400 dark:text-slate-500 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
