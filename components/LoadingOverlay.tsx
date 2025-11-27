
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Processing...", isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-slate-200 dark:border-slate-700 max-w-sm mx-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Please Wait</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
