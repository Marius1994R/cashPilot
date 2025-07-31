import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  transactionService, 
  categoryService, 
  budgetService, 
  goalService, 
  recurringTransactionService,
  firebaseService 
} from '../services/firebaseService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Default categories
const defaultCategories = [
  { id: '1', name: 'Food & Dining', color: '#ef4444', type: 'expense' },
  { id: '2', name: 'Transportation', color: '#f97316', type: 'expense' },
  { id: '3', name: 'Entertainment', color: '#eab308', type: 'expense' },
  { id: '4', name: 'Shopping', color: '#22c55e', type: 'expense' },
  { id: '5', name: 'Healthcare', color: '#06b6d4', type: 'expense' },
  { id: '6', name: 'Utilities', color: '#3b82f6', type: 'expense' },
  { id: '7', name: 'Housing', color: '#8b5cf6', type: 'expense' },
  { id: '8', name: 'Education', color: '#ec4899', type: 'expense' },
  { id: '9', name: 'Salary', color: '#10b981', type: 'income' },
  { id: '10', name: 'Business', color: '#059669', type: 'income' },
  { id: '11', name: 'Investment', color: '#0d9488', type: 'income' },
  { id: '12', name: 'Other Income', color: '#0891b2', type: 'income' },
  { id: '13', name: 'Savings', color: '#10b981', type: 'expense' }
];

export const DataProvider = ({ children }) => {
  const { currentUser: user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [budgets, setBudgets] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState({ currency: 'USD', theme: 'light' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all user data when user logs in
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Reset data when user logs out
      setTransactions([]);
      setCategories(defaultCategories);
      setBudgets([]);
      setRecurringTransactions([]);
      setGoals([]);
      setSettings({ currency: 'USD', theme: 'light' });
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load all data in parallel
      const [
        transactionsData,
        categoriesData,
        budgetsData,
        recurringData,
        goalsData,
        settingsData
      ] = await Promise.all([
        transactionService.getAll(user.uid),
        categoryService.getAll(user.uid),
        budgetService.getAll(user.uid),
        recurringTransactionService.getAll(user.uid),
        goalService.getAll(user.uid),
        getUserSettings(user.uid)
      ]);

      setTransactions(transactionsData || []);
      
      // Use user categories if available, otherwise use defaults
      const userCategories = categoriesData && categoriesData.length > 0 
        ? categoriesData 
        : defaultCategories;
      
      // Ensure Savings category exists
      const hasSavingsCategory = userCategories.some(cat => cat.name === 'Savings');
      if (!hasSavingsCategory) {
        // Create Savings category in Firebase
        const savingsCategory = {
          name: 'Savings',
          color: '#10b981',
          type: 'expense'
        };
        try {
          const newSavingsCategory = await categoryService.create(savingsCategory, user.uid);
          userCategories.push(newSavingsCategory);
        } catch (error) {
          console.error('Error creating Savings category:', error);
          // Fallback to adding locally if Firebase fails
          userCategories.push({
            id: 'savings-fallback',
            ...savingsCategory
          });
        }
      }
      
      setCategories(userCategories);
      setBudgets(budgetsData || []);
      setRecurringTransactions(recurringData || []);
      setGoals(goalsData || []);
      
      const userSettings = settingsData || { currency: 'USD', theme: 'light' };
      setSettings(userSettings);
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', userSettings.theme);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Settings helpers
  const getUserSettings = async (userId) => {
    try {
      const result = await firebaseService.getAll('settings', userId);
      return result[0] || null; // Get first settings document
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  };

  const saveUserSettings = async (newSettings) => {
    if (!user) return;
    
    try {
      // Check if settings document exists
      const existingSettings = await getUserSettings(user.uid);
      
      if (existingSettings) {
        await firebaseService.update('settings', existingSettings.id, newSettings);
      } else {
        await firebaseService.create('settings', newSettings, user.uid);
      }
      
      setSettings(newSettings);
      document.documentElement.setAttribute('data-theme', newSettings.theme);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    }
  };

  // Transaction operations
  const addTransaction = async (transaction) => {
    console.log('[DataContext] addTransaction called with:', transaction);
    console.log('[DataContext] Current user:', user?.uid);
    
    if (!user) {
      console.error('[DataContext] No user authenticated');
      setError('User not authenticated');
      return;
    }
    
    try {
      console.log('[DataContext] Calling transactionService.create...');
      const newTransaction = await transactionService.create(transaction, user.uid);
      console.log('[DataContext] Transaction created successfully:', newTransaction);
      
      setTransactions(prev => {
        console.log('[DataContext] Updating transactions state. Previous count:', prev.length);
        const updated = [newTransaction, ...prev];
        console.log('[DataContext] New transactions count:', updated.length);
        return updated;
      });
      
      return newTransaction;
    } catch (error) {
      console.error('[DataContext] Error adding transaction:', error);
      console.error('[DataContext] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      setError(`Failed to add transaction: ${error.message}`);
      throw error;
    }
  };

  const updateTransaction = async (id, updates) => {
    if (!user) return;
    
    try {
      const updatedTransaction = await transactionService.update(id, updates);
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Failed to update transaction');
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    
    try {
      await transactionService.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
      throw error;
    }
  };

  // Category operations
  const addCategory = async (category) => {
    if (!user) return;
    
    try {
      const newCategory = await categoryService.create(category, user.uid);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category');
      throw error;
    }
  };

  const updateCategory = async (id, updates) => {
    if (!user) return;
    
    try {
      const updatedCategory = await categoryService.update(id, updates);
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    if (!user) return;
    
    try {
      await categoryService.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
      throw error;
    }
  };

  // Budget operations
  const addBudget = async (budget) => {
    if (!user) return;
    
    try {
      const newBudget = await budgetService.create(budget, user.uid);
      setBudgets(prev => [...prev, newBudget]);
      return newBudget;
    } catch (error) {
      console.error('Error adding budget:', error);
      setError('Failed to add budget');
      throw error;
    }
  };

  const updateBudget = async (id, updates) => {
    if (!user) return;
    
    try {
      const updatedBudget = await budgetService.update(id, updates);
      setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));
      return updatedBudget;
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Failed to update budget');
      throw error;
    }
  };

  const deleteBudget = async (id) => {
    if (!user) return;
    
    try {
      await budgetService.delete(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget');
      throw error;
    }
  };

  // Goal operations
  const addGoal = async (goal) => {
    if (!user) return;
    
    try {
      const newGoal = await goalService.create(goal, user.uid);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Failed to add goal');
      throw error;
    }
  };

  const updateGoal = async (id, updates) => {
    if (!user) return;
    
    try {
      const updatedGoal = await goalService.update(id, updates);
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      setError('Failed to update goal');
      throw error;
    }
  };

  const deleteGoal = async (id) => {
    if (!user) return;
    
    try {
      await goalService.delete(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal');
      throw error;
    }
  };

  // Recurring transaction operations
  const addRecurringTransaction = async (recurringTransaction) => {
    if (!user) return;
    
    try {
      const newRecurring = await recurringTransactionService.create(recurringTransaction, user.uid);
      setRecurringTransactions(prev => [...prev, newRecurring]);
      return newRecurring;
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
      setError('Failed to add recurring transaction');
      throw error;
    }
  };

  const updateRecurringTransaction = async (id, updates) => {
    if (!user) return;
    
    try {
      const updatedRecurring = await recurringTransactionService.update(id, updates);
      setRecurringTransactions(prev => prev.map(r => r.id === id ? updatedRecurring : r));
      return updatedRecurring;
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      setError('Failed to update recurring transaction');
      throw error;
    }
  };

  const deleteRecurringTransaction = async (id) => {
    if (!user) return;
    
    try {
      await recurringTransactionService.delete(id);
      setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      setError('Failed to delete recurring transaction');
      throw error;
    }
  };

  const value = {
    // Data
    transactions,
    categories,
    budgets,
    recurringTransactions,
    goals,
    settings,
    loading,
    error,
    
    // Transaction operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Budget operations
    addBudget,
    updateBudget,
    deleteBudget,
    
    // Goal operations
    addGoal,
    updateGoal,
    deleteGoal,
    
    // Recurring transaction operations
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    
    // Settings
    updateSettings: saveUserSettings,
    
    // Utility
    loadAllData,
    clearError: () => setError(null)
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};