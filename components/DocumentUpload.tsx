
import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Language, Transaction } from '../types';
import { analyzeFinancialDocument } from '../services/geminiService';
import { bulkAddTransactions, formatCurrency } from '../services/mockFirebaseService';
import { getTranslation } from '../translations';
import LoadingOverlay from './LoadingOverlay';

interface DocumentUploadProps {
  lang: Language;
  onSuccess: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ lang, onSuccess }) => {
  const t = (key: any) => getTranslation(lang, key);
  const locale = lang === 'es' ? 'es-MX' : 'en-US';

  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<Transaction>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalyzedData([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const transactions = await analyzeFinancialDocument(base64String, file.type);
        
        if (transactions.length === 0) {
            setError(lang === 'es' ? 'No se encontraron transacciones válidas.' : 'No valid transactions found.');
        } else {
            setAnalyzedData(transactions);
        }
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error(err);
      setError('Failed to analyze document. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleConfirm = async () => {
    if (analyzedData.length > 0) {
      setIsSaving(true);
      await bulkAddTransactions(analyzedData);
      setIsSaving(false);
      onSuccess();
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col relative">
      <LoadingOverlay isVisible={isAnalyzing} message={t('analyzing')} />
      <LoadingOverlay isVisible={isSaving} message={t('saving')} />

      {analyzedData.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center flex flex-col items-center justify-center flex-1 shadow-lg animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('uploadTitle')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">{t('uploadDesc')}</p>

          <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                w-full max-w-lg border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }
              `}
            >
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{t('dropFile')}</span>
              </label>
            </div>
          
          {error && (
            <div className="mt-6 p-3 bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 animate-in slide-in-from-bottom-10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
               <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                 <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('foundTxs')}</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{analyzedData.length} records identified</p>
               </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {analyzedData.map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{tx.description}</p>
                  <p className="text-xs text-slate-500">{tx.date} • {(tx.category as any)?.name || tx.category}</p>
                </div>
                <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount), locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-4">
            <button 
              onClick={() => setAnalyzedData([])}
              className="px-5 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium"
            >
              {t('cancel')}
            </button>
            <button 
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              {t('confirmImport')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
