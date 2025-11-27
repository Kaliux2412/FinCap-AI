
// Schema Definition based on User Request

export type Language = 'en' | 'es';

export type TransactionType = 'income' | 'expense';
export type ExpenseCategory = 'fixed' | 'variable' | 'subscription';

// --- DATABASE SCHEMA TYPES ---

export interface User {
  id: string; // Implicit in DB, explicit here for relations
  displayName: string;
  email: string;
  password?: string; // Added for mock auth
  createdAt: string; // Timestamp
  photoUrl?: string;
  lastLogin?: string; // Timestamp
  companyName?: string; // Added for context
}

export interface Account {
  id: string;
  user: User;
  name: string;
  type: string; // 'checking', 'savings', etc.
  createdAt: string; // Timestamp
  provider?: string;
  lastSyncedAt?: string; // Timestamp
  // Helper for UI, not in strict schema but needed for calculations
  _computedBalance?: number; 
}

export interface Category {
  id: string;
  user: User;
  name: string;
  type: string; // 'income', 'expense'
  createdAt: string; // Timestamp
  isUserDefined: boolean;
}

export interface Transaction {
  id: string;
  user: User;
  account: Account;
  description: string;
  amount: number; // Float
  type: string; // 'income', 'expense'
  date: string; // Date
  createdAt: string; // Timestamp
  category?: Category | null; // Nullable in schema implies optional
  notes?: string;
  
  // UI Helpers (Mapped to 'notes' or handled in logic, but kept optional for UI state)
  expenseType?: 'fixed' | 'variable' | 'subscription';
  isRecurring?: boolean;
  nextDueDate?: string;
  installments?: {
    current: number;
    total: number;
  };
}

export interface Budget {
  id: string;
  user: User;
  category: Category;
  amount: number; // Float
  period: string; // 'monthly', 'yearly', etc.
  startDate: string; // Date
  createdAt: string; // Timestamp
  endDate?: string; // Date
}

export interface Investment {
  id: string;
  user: User;
  account: Account;
  symbolOrName: string;
  quantity: number; // Float
  purchasePrice: number; // Float
  purchaseDate: string; // Date
  createdAt: string; // Timestamp
  currentPrice?: number; // Float
  type?: string;
}

export interface Insight {
  id: string;
  user: User;
  title: string;
  description: string;
  type: string; // 'warning', 'opportunity', 'info'
  createdAt: string; // Timestamp
  isRead: boolean;
  relatedTransactionId?: string; // UUID
  relatedBudgetId?: string; // UUID
}

export interface Conversation {
  id: string;
  user: User;
  startedAt: string; // Timestamp
  lastActivityAt?: string; // Timestamp
  topic?: string;
}

export interface Message {
  id: string;
  conversation: Conversation;
  user: User;
  content: string;
  senderType: string; // 'user' or 'ai'
  sentAt: string; // Timestamp
  feedback?: string;
  aiResponseId?: string;
}

// --- UI CONTEXT HELPERS ---

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  burnRate: number;
  projectedCash?: number;
}

export interface FinancialContext {
  user: User;
  companyName: string;
  currentCash: number;
  monthlyBurn: number;
  runwayMonths: number;
  safeToSpend: number;
  riskThreshold: number;
  monthlyData: MonthlyData[];
  recentTransactions: Transaction[];
  upcomingExpenses: Transaction[];
}

export interface ActivityFilters {
  type?: 'all' | 'income' | 'expense';
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  search?: string;
}