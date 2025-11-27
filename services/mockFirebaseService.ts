
import { 
  FinancialContext, MonthlyData, Transaction, ActivityFilters, Message, 
  User, Account, Category, Conversation
} from '../types';
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, parseISO, compareAsc, addMonths } from 'date-fns';
import { initialData } from '../data';

// --- MOCK DATABASE STATE ---

const CURRENT_DATE_STR = '2025-11-18';

// In-memory storage initialized from data.ts
let users: User[] = initialData.users as unknown as User[];
// We need to map raw JSON data to our Typescript interfaces which might need object references
// For simplicity in this mock, we keep IDs and link dynamically or rebuild objects
let accounts: Account[] = []; 
let transactions: Transaction[] = [];
let categories: Category[] = [];
let conversations: Conversation[] = [];
let messages: Message[] = [];

// Active Session
let currentUser: User | null = null;

// --- INITIALIZATION HELPER ---
const initializeDataForUser = (user: User) => {
  // Load accounts for this user from JSON if not already loaded
  const userAccountsRaw = initialData.accounts.filter((a: any) => a.userId === user.id);
  
  // If accounts don't exist in our memory yet, add them
  userAccountsRaw.forEach((accRaw: any) => {
    if (!accounts.find(a => a.id === accRaw.id)) {
      accounts.push({
        id: accRaw.id,
        user: user,
        name: accRaw.name,
        type: accRaw.type,
        createdAt: new Date().toISOString(),
        _computedBalance: accRaw.balance
      });
    }
  });

  // Load transactions
  const userTxRaw = initialData.transactions.filter((t: any) => t.userId === user.id);
  
  userTxRaw.forEach((txRaw: any) => {
    if (!transactions.find(t => t.id === txRaw.id)) {
      // Ensure category exists
      let cat = categories.find(c => c.name === txRaw.category && c.user.id === user.id);
      if (!cat) {
        cat = {
          id: `cat_${Math.random()}`,
          user: user,
          name: txRaw.category,
          type: txRaw.type,
          createdAt: new Date().toISOString(),
          isUserDefined: false
        };
        categories.push(cat);
      }
      
      const account = accounts.find(a => a.user.id === user.id) || accounts[0]; // Fallback

      transactions.push({
        id: txRaw.id,
        user: user,
        account: account!,
        description: txRaw.description,
        amount: txRaw.amount,
        type: txRaw.type,
        date: txRaw.date,
        createdAt: new Date().toISOString(),
        category: cat
      });
    }
  });
};


// --- AUTH SERVICE ---

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    currentUser = user;
    initializeDataForUser(user);
    return user;
  }
  return null;
};

export const registerUser = async (email: string, password: string, displayName: string, companyName: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const newUser: User = {
    id: `u_${Date.now()}`,
    email,
    password,
    displayName,
    companyName,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  users.push(newUser);
  currentUser = newUser;
  
  // Create default account
  const newAccount: Account = {
    id: `acc_${Date.now()}`,
    user: newUser,
    name: 'Main Business Account',
    type: 'checking',
    createdAt: new Date().toISOString(),
    _computedBalance: 0
  };
  accounts.push(newAccount);

  // Create default categories
  ['Sales', 'Services', 'Rent', 'Payroll', 'Software', 'Marketing'].forEach((catName, idx) => {
     categories.push({
        id: `cat_${Date.now()}_${idx}`,
        user: newUser,
        name: catName,
        type: ['Sales', 'Services'].includes(catName) ? 'income' : 'expense',
        createdAt: new Date().toISOString(),
        isUserDefined: false
     });
  });

  return newUser;
};

export const logoutUser = () => {
  currentUser = null;
};

export const getCurrentUser = () => currentUser;

// --- DATA SERVICE ---

export const getChatHistory = (): Message[] => {
  if (!currentUser) return [];
  return messages.filter(m => m.user.id === currentUser!.id);
};

export const saveChatMessage = (message: Message): void => {
  if (!currentUser) return;
  messages.push(message);
};

export const clearChatHistory = (): void => {
  if (!currentUser) return;
  messages = messages.filter(m => m.user.id !== currentUser!.id);
};

export const fetchFinancialContext = async (): Promise<FinancialContext> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!currentUser) throw new Error("No user logged in");

  const userAccounts = accounts.filter(a => a.user.id === currentUser!.id);
  const userTxs = transactions.filter(t => t.user.id === currentUser!.id);

  // 1. Calculate Cash
  const currentCash = userAccounts.reduce((acc, account) => acc + (account._computedBalance || 0), 0);
  
  // 2. Calculate Burn (Average monthly expense based on actual data range)
  let monthlyBurn = 0;
  const expenseTxs = userTxs.filter(t => t.type === 'expense');
  if (expenseTxs.length > 0) {
      const totalExpense = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
      // Find date range
      const dates = expenseTxs.map(t => new Date(t.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      // Calculate difference in months
      let monthsDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1;
      monthsDiff = Math.max(1, monthsDiff); // Avoid division by zero
      
      monthlyBurn = totalExpense / monthsDiff;
  }

  // 3. Risk & Runway
  const riskThreshold = 5000; 
  const runwayMonths = monthlyBurn > 0 ? currentCash / monthlyBurn : 0;
  const safeToSpend = Math.max(0, currentCash - riskThreshold);

  // 4. Upcoming
  const upcomingExpenses = userTxs.filter(t => 
    t.type === 'expense' && t.isRecurring && t.nextDueDate
  );

  // 5. Monthly Data (Fixed Logic for PDF Imports)
  // Instead of hardcoded last 5 months, we look at the transaction range
  // to ensure imported data (which might be old) shows up.
  
  let chartStartDate = subMonths(new Date(CURRENT_DATE_STR), 5);
  const allDates = userTxs.map(t => new Date(t.date));
  
  if (allDates.length > 0) {
      const minTxDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      // If we have old data (e.g. from Jan), start chart from there, but cap at 12 months max for readability
      if (minTxDate < chartStartDate) {
          chartStartDate = minTxDate; 
          // Clamp to max 12 months back from today
          if (chartStartDate < subMonths(new Date(CURRENT_DATE_STR), 11)) {
              chartStartDate = subMonths(new Date(CURRENT_DATE_STR), 11);
          }
      }
  }

  // Generate intervals from chartStartDate to CURRENT_DATE + 1 Month (for projection)
  const months = eachMonthOfInterval({
    start: startOfMonth(chartStartDate),
    end: addMonths(new Date(CURRENT_DATE_STR), 1) // Show 1 month future
  });

  const monthlyData: MonthlyData[] = months.map(m => {
    // Filter transactions for this month
    const txs = userTxs.filter(t => isSameMonth(new Date(t.date), m));
    const revenue = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      month: format(m, 'MMM yy'),
      revenue: revenue,
      expenses: expenses,
      burnRate: expenses - revenue
    };
  });

  return {
    user: currentUser,
    companyName: currentUser.companyName || "My Startup",
    currentCash,
    monthlyBurn,
    runwayMonths,
    safeToSpend,
    riskThreshold,
    monthlyData,
    recentTransactions: userTxs.slice(0, 20).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    upcomingExpenses
  };
};

export const addTransaction = async (txData: Partial<Transaction>): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!currentUser) throw new Error("No user");

  // Handle Category
  let category = categories.find(c => c.user.id === currentUser!.id && (c.name === (txData.category as any)?.name || c.name === (txData.category as any)));
  
  if (!category && typeof txData.category === 'string') {
    category = {
      id: `cat_${Date.now()}`,
      user: currentUser,
      name: txData.category,
      type: txData.type || 'expense',
      createdAt: new Date().toISOString(),
      isUserDefined: true
    };
    categories.push(category);
  }

  // Find account
  const account = accounts.find(a => a.user.id === currentUser!.id) || accounts[0]; // Fallback

  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    user: currentUser,
    account: account!,
    description: txData.description || 'Untitled',
    amount: Number(txData.amount),
    type: txData.type || 'expense',
    date: txData.date || CURRENT_DATE_STR,
    createdAt: new Date().toISOString(),
    category: category || null,
    notes: txData.notes || '',
    
    // UI Helpers preserved
    expenseType: txData.expenseType,
    isRecurring: txData.isRecurring,
    nextDueDate: txData.nextDueDate,
    installments: txData.installments
  };

  transactions.unshift(newTx);

  // Update balance
  if (account) {
      if (newTx.type === 'income') {
        account._computedBalance = (account._computedBalance || 0) + newTx.amount;
      } else {
        account._computedBalance = (account._computedBalance || 0) - newTx.amount;
      }
  }
};

export const bulkAddTransactions = async (txs: Partial<Transaction>[]): Promise<void> => {
  for (const tx of txs) {
    await addTransaction(tx);
  }
};

export const filterTransactions = async (filters: ActivityFilters): Promise<Transaction[]> => {
  if (!currentUser) return [];
  
  let userTxs = transactions.filter(t => t.user.id === currentUser!.id);

  return userTxs.filter(tx => {
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.minAmount && tx.amount < filters.minAmount) return false;
    if (filters.maxAmount && tx.amount > filters.maxAmount) return false;
    if (filters.startDate && new Date(tx.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(tx.date) > new Date(filters.endDate)) return false;
    if (filters.category && filters.category !== 'all') {
      if (tx.category?.name !== filters.category) return false;
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      if (!tx.description.toLowerCase().includes(term)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getUniqueCategories = (): string[] => {
  if (!currentUser) return [];
  const userTxs = transactions.filter(t => t.user.id === currentUser!.id);
  const cats = new Set(userTxs.map(t => t.category?.name || 'Uncategorized'));
  return Array.from(cats).sort();
};

export const formatCurrency = (amount: number, locale: string = 'en-US'): string => {
  const safeAmount = isNaN(amount) ? 0 : amount;
  const currency = locale === 'es-MX' ? 'MXN' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};
