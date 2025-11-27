
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, User, Database, Sparkles, Trash2 } from 'lucide-react';
import { Message, FinancialContext, Language, Conversation } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { getChatHistory, saveChatMessage, clearChatHistory } from '../services/mockFirebaseService';
import ReactMarkdown from 'react-markdown';
import { getTranslation } from '../translations';
import LoadingOverlay from './LoadingOverlay';

interface ChatInterfaceProps {
  financialContext: FinancialContext;
  lang: Language;
  onDataUpdate: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ financialContext, lang, onDataUpdate }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false); // Guard ref for race conditions

  // Mock active conversation
  const conversation: Conversation = {
    id: 'conv_active',
    user: financialContext.user,
    startedAt: new Date().toISOString(),
    topic: 'Session'
  };

  const createWelcomeMessage = (): Message => ({
    id: 'welcome',
    conversation: conversation,
    user: financialContext.user,
    senderType: 'ai',
    content: lang === 'es' 
      ? `Hola **${financialContext.user.displayName}**! Soy **FinCap AI**.\n\nHoy es **18 de Noviembre de 2025**. Puedo ayudarte con:\n- Análisis de flujo de caja\n- Predicciones de riesgo\n- Crear registros de ingresos y gastos`
      : `Hello **${financialContext.user.displayName}**! I'm **FinCap AI**.\n\nToday is **November 18, 2025**. I can help you with:\n- Cash flow analysis\n- Risk predictions\n- Creating income/expense records`,
    sentAt: new Date().toISOString(),
  });

  useEffect(() => {
    const history = getChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      const welcomeMsg = createWelcomeMessage();
      setMessages([welcomeMsg]);
      saveChatMessage(welcomeMsg);
    }
  }, [lang, financialContext.companyName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = () => {
    clearChatHistory();
    const welcomeMsg = createWelcomeMessage();
    setMessages([welcomeMsg]);
    saveChatMessage(welcomeMsg);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleSend = async () => {
    if (!input.trim() || isSendingRef.current) return;

    // Set lock immediately
    isSendingRef.current = true;
    setIsLoading(true);

    const currentInput = input; 
    // Clear input immediately
    setInput('');

    const userMessage: Message = {
      id: generateId(),
      conversation: conversation,
      user: financialContext.user,
      senderType: 'user',
      content: currentInput,
      sentAt: new Date().toISOString(),
    };

    // Update local state and mock DB
    setMessages(prev => [...prev, userMessage]);
    saveChatMessage(userMessage);

    try {
        const response = await sendMessageToGemini(currentInput, financialContext, lang);

        const botMessage: Message = {
            id: generateId(),
            conversation: conversation,
            user: financialContext.user,
            senderType: 'ai',
            content: response.text,
            sentAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, botMessage]);
        saveChatMessage(botMessage);
        
        if (response.dataChanged) {
            onDataUpdate();
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
        // Delay release of lock to prevent debounce/double-enter issues
        setTimeout(() => {
             isSendingRef.current = false; 
        }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Ensure unique messages only for rendering
  const uniqueMessages = useMemo(() => {
      const seen = new Set();
      return messages.filter(msg => {
        const duplicate = seen.has(msg.id);
        seen.add(msg.id);
        return !duplicate;
      });
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl relative">
      
      <LoadingOverlay isVisible={isLoading} message="FinCap AI is thinking..." />

      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">FinCap Intelligence</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Gemini 2.5 • {financialContext.user.displayName}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleClearChat}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
          title={t('clearChat')}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
        {uniqueMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-5 ${msg.senderType === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              msg.senderType === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-600'
            }`}>
              {msg.senderType === 'user' ? <User className="w-6 h-6 text-slate-500 dark:text-slate-300" /> : <Bot className="w-6 h-6 text-white" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl p-5 shadow-md ${
              msg.senderType === 'user' 
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none border border-slate-200 dark:border-slate-700' 
                : 'bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200 border border-blue-100 dark:border-blue-500/20 rounded-tl-none'
            }`}>
              {msg.senderType === 'ai' ? (
                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 block opacity-70 text-right">
                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder')}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-[64px] custom-scrollbar text-base shadow-inner placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2.5 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-4">
           <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center flex items-center gap-1.5">
             <Database className="w-3 h-3" /> 
             Live Context: 18 Nov 2025, Safe to Spend, Cash Flow
           </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
