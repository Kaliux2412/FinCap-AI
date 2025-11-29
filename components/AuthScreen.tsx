
import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/mockFirebaseService';
import { User } from '../types';
import LoadingOverlay from './LoadingOverlay';
import { Lock, Mail, User as UserIcon, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State - Autofilled with demo credentials
  const [email, setEmail] = useState('alex@startup.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await loginUser(email, password);
        if (!user) {
          setError('Invalid email or password');
        } else {
          onAuthSuccess(user);
        }
      } else {
        if (!name || !company) {
          setError('Please fill in all fields');
        } else {
          user = await registerUser(email, password, name, company);
          onAuthSuccess(user);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123'); // Hardcoded for demo convenience
    setError('Demo selected. Click Sign In or enter password (password123) if changed in JSON.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <LoadingOverlay isVisible={loading} message={isLogin ? "Signing In..." : "Creating Account..."} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">
        
        {/* Left Side - Branding */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-10 flex flex-col justify-between text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] opacity-10 bg-cover bg-center"></div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
               <span className="font-bold text-2xl">FC</span>
             </div>
             <h1 className="text-4xl font-bold mb-4">FinCap AI</h1>
             <p className="text-blue-100 text-lg">Your intelligent CFO assistant. Analyze cash flow, predict risks, and manage startup finances with ease.</p>
           </div>
           
           <div className="relative z-10 mt-8 space-y-4">
             <div className="flex items-center gap-3 text-sm text-blue-100 bg-white/10 p-3 rounded-lg">
               <CheckCircle className="w-5 h-5 text-emerald-300" />
               <span>AI-Powered Insights</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-blue-100 bg-white/10 p-3 rounded-lg">
               <CheckCircle className="w-5 h-5 text-emerald-300" />
               <span>Document Scanning</span>
             </div>
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {isLogin ? 'Enter your credentials to access your dashboard.' : 'Get started with your AI financial assistant.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          {/* Demo Credentials */}
          {isLogin && (
             <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
               <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                 <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   Demo Credentials (Auto-filled)
                 </p>
                 <div className="space-y-2 text-sm">
                   <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
                     <span className="text-slate-500 dark:text-slate-400 font-medium">Email:</span>
                     <code className="text-blue-600 dark:text-blue-400 font-mono text-xs">alex@startup.com</code>
                   </div>
                   <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
                     <span className="text-slate-500 dark:text-slate-400 font-medium">Password:</span>
                     <code className="text-blue-600 dark:text-blue-400 font-mono text-xs">password123</code>
                   </div>
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                   This is a demo application. Click "Sign In" to access the dashboard.
                 </p>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
