import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Settings,
  Moon,
  Sun,
  Download,
  Upload,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Folder,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  FileText,
  Repeat,
  Flag,
  LogOut,
  User
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import AuthForm from './components/Auth/AuthForm';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import Budgets from './components/Budgets';
import RecurringTransactions from './components/RecurringTransactions';
import SpendingInsights from './components/SpendingInsights';
import GoalTracking from './components/GoalTracking';
import DebugPanel from './components/Debug/DebugPanel';
import Alert from './components/Alert';
import Confirm from './components/Confirm';
import { currencies } from './utils/currencies';
import { useModal } from './hooks/useModal';



// Main authenticated app component
function AuthenticatedApp() {
  const { currentUser, logout } = useAuth();
  const {
    transactions,
    categories,
    budgets,
    recurringTransactions,
    goals,
    settings,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    updateSettings,
    clearError
  } = useData();

  // Show loading state BEFORE any other hooks to prevent hook order issues
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your financial data...</p>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  
  // Modal hook for professional notifications
  const modal = useModal();

  // Helper function to get last day of month
  const getLastDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Helper function to determine if a transaction should be generated
  const shouldGenerateTransaction = (recurring, date) => {
    const startDate = new Date(recurring.startDate);
    
    switch (recurring.frequency) {
      case 'daily':
        return date >= startDate;
      
      case 'weekly':
        return date >= startDate && date.getDay() === recurring.dayOfWeek;
      
      case 'monthly':
        const targetDay = Math.min(recurring.dayOfMonth, getLastDayOfMonth(date));
        return date >= startDate && date.getDate() === targetDay;
      
      case 'yearly':
        return date >= startDate && 
               date.getMonth() === startDate.getMonth() && 
               date.getDate() === startDate.getDate();
      
      default:
        return false;
    }
  };

  // Function to generate transactions from recurring transactions
  const generateRecurringTransactions = async () => {
    const today = new Date();
    let generatedCount = 0;

    for (const recurring of recurringTransactions.filter(r => r.isActive)) {
      const startDate = new Date(recurring.startDate);
      const endDate = recurring.endDate ? new Date(recurring.endDate) : null;

      // Skip if end date has passed
      if (endDate && today > endDate) continue;

      // Skip if start date is in the future  
      if (startDate > today) continue;

      // Check if we need to generate a transaction for today
      const shouldGenerate = shouldGenerateTransaction(recurring, today);
      
      if (shouldGenerate) {
        // Check if transaction already exists for today
        const todayDateString = today.toISOString().split('T')[0];
        const existingTransaction = transactions.find(t => 
          t.date === todayDateString && 
          t.recurringId === recurring.id
        );

        if (!existingTransaction) {
          try {
            const newTransaction = {
              type: recurring.type,
              amount: recurring.amount,
              description: `${recurring.description} (Auto)`,
              categoryId: recurring.categoryId,
              date: todayDateString,
              recurringId: recurring.id,
              notes: recurring.notes || ''
            };
            
            await addTransaction(newTransaction);
            generatedCount++;
          } catch (error) {
            console.error('Error generating recurring transaction:', error);
          }
        }
      }
    }

    if (generatedCount > 0) {
      console.log(`Generated ${generatedCount} recurring transactions`);
    }
  };

  // Apply theme when settings change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Clear error when user interacts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Handle header hide/show and nav effects on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let isScrollingDown = false;
    let ticking = false;
    let navUpdateTimeout = null;

    const updateNavPosition = () => {
      const header = document.querySelector('.header');
      const nav = document.querySelector('.nav');
      
      if (header && nav) {
        if (header.classList.contains('hidden')) {
          // When header is hidden, nav sticks to top
          nav.style.top = '0px';
          nav.classList.add('header-hidden');
        } else {
          // When header is visible, nav sticks below header
          const headerHeight = header.offsetHeight;
          nav.style.top = `${headerHeight}px`;
          nav.classList.remove('header-hidden');
        }
      }
    };

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const header = document.querySelector('.header');
      const nav = document.querySelector('.nav');
      
      // Determine scroll direction with small threshold to prevent jitter
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      if (scrollDifference > 2) {
        isScrollingDown = currentScrollY > lastScrollY;
      }
      
      // Header visibility logic
      if (header) {
        const wasHidden = header.classList.contains('hidden');
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        
        // Check if we're near the bottom (within 50px) to prevent mobile bounce issues
        const isNearBottom = currentScrollY + windowHeight >= documentHeight - 50;
        
        // Detect if we're in bounce scroll territory (past actual bottom)
        const isPastBottom = currentScrollY + windowHeight > documentHeight;
        
        // Hide/show logic with enhanced mobile bounce protection
        if (currentScrollY > 100 && isScrollingDown && !isNearBottom && !isPastBottom) {
          // Hide header when scrolling down after 100px (but not near or past bottom)
          header.classList.add('hidden');
        } else if (!isScrollingDown || currentScrollY < 50 || isNearBottom || isPastBottom) {
          // Show header when scrolling up, near top, near bottom, or past bottom
          header.classList.remove('hidden');
        }
        
        // Update nav position if header visibility changed
        const isHidden = header.classList.contains('hidden');
        if (wasHidden !== isHidden) {
          // Clear any pending nav update
          if (navUpdateTimeout) {
            clearTimeout(navUpdateTimeout);
          }
          
          // If we're near/past bottom, debounce the nav update to prevent rapid changes
          if (isNearBottom || isPastBottom) {
            navUpdateTimeout = setTimeout(() => {
              updateNavPosition();
            }, 100); // Short delay to prevent rapid bouncing
          } else {
            // Immediate update for normal scrolling
            updateNavPosition();
          }
        }
        
        // Add scrolled class for enhanced shadow
        if (currentScrollY > 10) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
      
      // Navigation effects - but avoid updates during bounce scrolling
      if (nav) {
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const isPastBottom = currentScrollY + windowHeight > documentHeight;
        
        if (!isPastBottom) {
          if (currentScrollY > 10) {
            nav.classList.add('scrolled');
          } else {
            nav.classList.remove('scrolled');
          }
        }
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    // Set initial nav position
    updateNavPosition();
    
    // Handle resize
    const handleResize = () => {
      updateNavPosition();
    };

    // Use passive listeners for better mobile performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll, { passive: true });
      window.removeEventListener('resize', handleResize, { passive: true });
      if (navUpdateTimeout) {
        clearTimeout(navUpdateTimeout);
      }
    };
  }, []);

  // Generate recurring transactions on app load and daily
  useEffect(() => {
    if (loading || recurringTransactions.length === 0) return;
    
    generateRecurringTransactions();
    
    // Set up daily check (every 24 hours)
    const interval = setInterval(generateRecurringTransactions, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loading, recurringTransactions]);

  // Scroll to top when navigating between tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);



  const handleAddTransaction = async (transaction) => {
    try {
      await addTransaction(transaction);
      setShowTransactionForm(false);
      
      await modal.showAlert({
        title: 'Transaction Added',
        message: 'Transaction has been successfully saved to your account.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to add transaction. Please try again.',
        type: 'error'
      });
    }
  };

  const handleUpdateTransaction = async (updatedTransaction) => {
    try {
      await updateTransaction(updatedTransaction.id, updatedTransaction);
      setEditingTransaction(null);
      setShowTransactionForm(false);
      
      await modal.showAlert({
        title: 'Transaction Updated',
        message: 'Transaction has been successfully updated.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to update transaction. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteTransaction = async (id) => {
    // Find the transaction to get details for confirmation
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const category = categories.find(c => c.id === transaction.categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    
    const currency = currencies.find(c => c.code === settings.currency) || currencies[0];
    const amountFormatted = `${transaction.type === 'expense' ? '-' : '+'}${currency.symbol}${Math.abs(transaction.amount).toFixed(2)}`;
    
    const confirmed = await modal.showConfirm({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete this transaction?\n\n${transaction.description}\n\nThis action cannot be undone.`,
      confirmText: 'Delete Transaction',
      cancelText: 'Cancel',
      type: 'confirm',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await deleteTransaction(id);
        
        await modal.showAlert({
          title: 'Transaction Deleted',
          message: 'The transaction has been successfully deleted.',
          type: 'success'
        });
      } catch (error) {
        await modal.showAlert({
          title: 'Error',
          message: 'Failed to delete transaction. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleAddCategory = async (category) => {
    try {
      await addCategory(category);
      
      await modal.showAlert({
        title: 'Category Added',
        message: 'Category has been successfully created.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to add category. Please try again.',
        type: 'error'
      });
    }
  };

  const handleUpdateCategory = async (updatedCategory) => {
    try {
      await updateCategory(updatedCategory.id, updatedCategory);
      
      await modal.showAlert({
        title: 'Category Updated',
        message: 'Category has been successfully updated.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to update category. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    // Find the category to get details for confirmation
    const category = categories.find(c => c.id === id);
    if (!category) return;

    // Check how many transactions use this category
    const relatedTransactions = transactions.filter(t => t.categoryId === id);
    const relatedBudgets = budgets.filter(b => b.categoryId === id);
    
    let warningMessage = `Are you sure you want to delete this category?\n\n"${category.name}"\n`;
    
    if (relatedTransactions.length > 0) {
      warningMessage += `⚠️ This will affect ${relatedTransactions.length} transaction(s) using this category.\n`;
    }
    
    if (relatedBudgets.length > 0) {
      warningMessage += `⚠️ This will also delete ${relatedBudgets.length} budget(s) for this category.\n`;
    }
    
    warningMessage += `\nThis action cannot be undone.`;
    
    const confirmed = await modal.showConfirm({
      title: 'Delete Category',
      message: warningMessage,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      type: 'warning',
      isDestructive: true
    });

    if (confirmed) {
      try {
        // Remove the category
        await deleteCategory(id);
        
        // Remove related budgets
        if (relatedBudgets.length > 0) {
          await Promise.all(relatedBudgets.map(budget => deleteBudget(budget.id)));
        }
        
        await modal.showAlert({
          title: 'Category Deleted',
          message: `The category "${category.name}" has been successfully deleted.${relatedTransactions.length > 0 ? `\n\n${relatedTransactions.length} transaction(s) will now show "Unknown Category".` : ''}`,
          type: 'success'
        });
      } catch (error) {
        await modal.showAlert({
          title: 'Error',
          message: 'Failed to delete category. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleAddBudget = async (budget) => {
    try {
      await addBudget(budget);
      await modal.showAlert({
        title: 'Budget Added',
        message: 'Budget has been successfully created.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to add budget. Please try again.',
        type: 'error'
      });
    }
  };

  const handleUpdateBudget = async (updatedBudget) => {
    try {
      await updateBudget(updatedBudget.id, updatedBudget);
      await modal.showAlert({
        title: 'Budget Updated',
        message: 'Budget has been successfully updated.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to update budget. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteBudget = async (id) => {
    // Find the budget to get details for confirmation
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;

    const category = categories.find(c => c.id === budget.categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    const currency = currencies.find(c => c.code === settings.currency) || currencies[0];
    
    const confirmed = await modal.showConfirm({
      title: 'Delete Budget',
      message: `Are you sure you want to delete this budget?\n\n ${budget.name || categoryName + ' Budget'}\n\nThis action cannot be undone.`,
      confirmText: 'Delete Budget',
      cancelText: 'Cancel',
      type: 'confirm',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await deleteBudget(id);
        
        await modal.showAlert({
          title: 'Budget Deleted',
          message: 'The budget has been successfully deleted.',
          type: 'success'
        });
      } catch (error) {
        await modal.showAlert({
          title: 'Error',
          message: 'Failed to delete budget. Please try again.',
          type: 'error'
        });
      }
    }
  };

  // Goal handlers
  const handleAddGoal = async (goal) => {
    try {
      await addGoal(goal);
      await modal.showAlert({
        title: 'Goal Added',
        message: 'Goal has been successfully created.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to add goal. Please try again.',
        type: 'error'
      });
    }
  };

  const handleUpdateGoal = async (updatedGoal) => {
    try {
      await updateGoal(updatedGoal.id, updatedGoal);
      await modal.showAlert({
        title: 'Goal Updated',
        message: 'Goal has been successfully updated.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to update goal. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteGoal = async (id) => {
    // Find the goal to get details for confirmation
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const currency = currencies.find(c => c.code === settings.currency) || currencies[0];
    const currentAmountFormatted = `${currency.symbol}${Math.abs(goal.currentAmount).toFixed(2)}`;
    const targetAmountFormatted = `${currency.symbol}${Math.abs(goal.targetAmount).toFixed(2)}`;
    
    const confirmed = await modal.showConfirm({
      title: 'Delete Savings Goal',
      message: `Are you sure you want to delete this goal?\n\n"${goal.name}"\n\nThis action cannot be undone and all progress data will be permanently lost.`,
      confirmText: 'Delete Goal',
      cancelText: 'Cancel',
      type: 'confirm',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await deleteGoal(id);
        await modal.showAlert({
          title: 'Goal Deleted',
          message: 'The savings goal has been successfully deleted.',
          type: 'success'
        });
      } catch (error) {
        await modal.showAlert({
          title: 'Error',
          message: 'Failed to delete goal. Please try again.',
          type: 'error'
        });
      }
    }
  };

  // Recurring Transactions handlers
  const handleAddRecurringTransaction = async (recurringTransaction) => {
    try {
      await addRecurringTransaction(recurringTransaction);
      await modal.showAlert({
        title: 'Recurring Transaction Added',
        message: 'Recurring transaction has been successfully created.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to add recurring transaction. Please try again.',
        type: 'error'
      });
    }
  };

  const handleUpdateRecurringTransaction = async (updatedRecurring) => {
    try {
      await updateRecurringTransaction(updatedRecurring.id, updatedRecurring);
      await modal.showAlert({
        title: 'Recurring Transaction Updated',
        message: 'Recurring transaction has been successfully updated.',
        type: 'success'
      });
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to update recurring transaction. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteRecurringTransaction = async (id) => {
    const recurring = recurringTransactions.find(r => r.id === id);
    if (!recurring) return;

    const category = categories.find(c => c.id === recurring.categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    const currency = currencies.find(c => c.code === settings.currency) || currencies[0];
    
    const confirmed = await modal.showConfirm({
      title: 'Delete Recurring Transaction',
      message: `Are you sure you want to delete this recurring transaction?\n\n "${recurring.description}"\n\nThis will not affect already generated transactions.`,
      confirmText: 'Delete Recurring Transaction',
      cancelText: 'Cancel',
      type: 'confirm',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await deleteRecurringTransaction(id);
        
        await modal.showAlert({
          title: 'Recurring Transaction Deleted',
          message: 'The recurring transaction has been successfully deleted.',
          type: 'success'
        });
      } catch (error) {
        await modal.showAlert({
          title: 'Error',
          message: 'Failed to delete recurring transaction. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleToggleRecurringTransactionActive = async (id, isActive) => {
    try {
      const recurringTransaction = recurringTransactions.find(r => r.id === id);
      if (recurringTransaction) {
        await updateRecurringTransaction(id, { ...recurringTransaction, isActive });
      }
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to update recurring transaction status.',
        type: 'error'
      });
    }
  };

  // Settings handler (no confirmation modals for smoother UX)
  const handleUpdateSettings = async (newSettings) => {
    try {
      await updateSettings(newSettings);
      // No success modal - instant feedback through UI changes is sufficient
    } catch (error) {
      await modal.showAlert({
        title: 'Error',
        message: 'Failed to save settings. Please try again.',
        type: 'error'
      });
    }
  };



  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await handleUpdateSettings({
      ...settings,
      theme: newTheme
    });
  };

  // Enhanced settings handlers
  const handleCurrencyChange = async (currency) => {
    await handleUpdateSettings({
      ...settings,
      currency: currency
    });
    setShowSettingsDropdown(false);
  };

  const handleDisplayNameUpdate = async (newDisplayName) => {
    try {
      // Update Firebase Auth profile
      if (currentUser && newDisplayName.trim()) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(currentUser, {
          displayName: newDisplayName.trim()
        });
        
        modal.showAlert({
          title: 'Profile Updated',
          message: 'Your display name has been updated successfully.',
          type: 'success'
        });
      }
    } catch (error) {
      modal.showAlert({
        title: 'Update Failed',
        message: 'Failed to update display name. Please try again.',
        type: 'error'
      });
    }
    setEditingDisplayName(false);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.settings-dropdown')) {
      setShowSettingsDropdown(false);
    }
  };

  // Add click outside listener
  React.useEffect(() => {
    if (showSettingsDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSettingsDropdown]);

  const exportData = async () => {
    const exportStats = {
      transactions: transactions.length,
      categories: categories.length,
      budgets: budgets.length,
      recurringTransactions: recurringTransactions.length,
      goals: goals.length,
      settings: Object.keys(settings).length
    };
    
    const message = `This will download a JSON file containing:\n\n• ${exportStats.transactions} transactions\n• ${exportStats.categories} categories\n• ${exportStats.budgets} budgets\n• ${exportStats.recurringTransactions} recurring transactions\n• ${exportStats.goals} goals\n• Your settings (theme, currency)`;
    
    const confirmed = await modal.showConfirm({
      title: 'Export CashPilot Data',
      message: message,
      confirmText: 'Download',
      cancelText: 'Cancel',
      type: 'info'
    });
    
    if (!confirmed) return;
    
    const dataToExport = {
      transactions,
      categories,
      budgets,
      recurringTransactions,
      goals,
      settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-pilot-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    await modal.showAlert({
      title: 'Export Successful',
      message: 'Your data has been exported successfully!',
      type: 'success'
    });
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          let importedItems = [];
          
          // Import data with validation
          if (importedData.transactions && Array.isArray(importedData.transactions)) {
            setTransactions(importedData.transactions);
            importedItems.push(`${importedData.transactions.length} transactions`);
          }
          
          if (importedData.categories && Array.isArray(importedData.categories)) {
            setCategories(importedData.categories);
            importedItems.push(`${importedData.categories.length} categories`);
          }
          
          if (importedData.budgets && Array.isArray(importedData.budgets)) {
            setBudgets(importedData.budgets);
            importedItems.push(`${importedData.budgets.length} budgets`);
          }
          
          if (importedData.recurringTransactions && Array.isArray(importedData.recurringTransactions)) {
            setRecurringTransactions(importedData.recurringTransactions);
            importedItems.push(`${importedData.recurringTransactions.length} recurring transactions`);
          }
          
          if (importedData.goals && Array.isArray(importedData.goals)) {
            setGoals(importedData.goals);
            importedItems.push(`${importedData.goals.length} goals`);
          }
          
          if (importedData.settings && typeof importedData.settings === 'object') {
            setSettings(prev => ({ ...prev, ...importedData.settings }));
            importedItems.push('settings');
          }
          
          if (importedItems.length > 0) {
            await modal.showAlert({
              title: 'Import Successful',
              message: `Data imported successfully!\n\nImported: ${importedItems.join(', ')}`,
              type: 'success'
            });
          } else {
            await modal.showAlert({
              title: 'No Data Found',
              message: 'No valid data found in the file. Please check the file format.',
              type: 'warning'
            });
          }
        } catch (error) {
          await modal.showAlert({
            title: 'Import Failed',
            message: 'Error importing data. Please check that the file is a valid JSON format.',
            type: 'error'
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset the file input so the same file can be selected again
    event.target.value = '';
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'transactions', label: 'Transactions', icon: Wallet },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'goals', label: 'Goals', icon: Flag },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'insights', label: 'Insights & Reports', icon: TrendingUp },
  ];

  return (
    <div className="app">
      {/* Firebase Error Display */}
      {error && (
        <div className="error-banner" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ef4444',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          zIndex: 9999
        }}>
          {error} <button onClick={clearError} style={{ 
            background: 'transparent', 
            border: '1px solid white', 
            color: 'white', 
            marginLeft: '8px',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>✕</button>
        </div>
      )}
      
      {/* Header */}
      <header className="header" style={{ marginTop: error ? '40px' : '0' }}>
        <div className="header-content">
          <div className="header-left">
            <div className="logo" onClick={() => setActiveTab('dashboard')}>
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="20" fill="#10B981" />
                  <g transform="translate(10, 10) scale(2.5)">
                    <path
                      d="M3.363 4.414l4.875 19.348 9.467-3.018-8.448-10.298 10.902 9.56 8.853-2.77-25.649-12.822zM18.004 27.586v-5.324l-3.116 0.926 3.116 4.398z"
                      fill="white"
                      transform="scale(-1,1) translate(-32,0)"
                    />
                  </g>
                  <circle cx="18" cy="18" r="10" fill="white" />
                  <text
                    x="18"
                    y="21"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#10B981"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    $
                  </text>
                </svg>
              </div>
              <h1>CashPilot</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="settings-dropdown">
              <button 
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="settings-trigger"
                title="Settings & Profile"
              >
                <Settings size={20} />
                <span className="user-name-compact">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</span>
              </button>
              
              {showSettingsDropdown && (
                <div className="settings-menu">
                  {/* User Profile Section */}
                  <div className="settings-section">
                    <div className="settings-section-header">
                      <User size={16} />
                      <span>Profile</span>
                    </div>
                    <div className="settings-item">
                      <label>Display Name</label>
                      {editingDisplayName ? (
                        <div className="inline-edit">
                          <input
                            type="text"
                            defaultValue={currentUser?.displayName || ''}
                            onBlur={(e) => handleDisplayNameUpdate(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleDisplayNameUpdate(e.target.value);
                              if (e.key === 'Escape') setEditingDisplayName(false);
                            }}
                            autoFocus
                            className="inline-input"
                          />
                        </div>
                      ) : (
                        <div className="setting-value" onClick={() => setEditingDisplayName(true)}>
                          {currentUser?.displayName || 'Click to set'}
                          <Edit size={14} />
                        </div>
                      )}
                    </div>
                    <div className="settings-item">
                      <label>Email</label>
                      <div className="setting-value readonly">
                        {currentUser?.email}
                      </div>
                    </div>
                  </div>

                  {/* Appearance Section */}
                  <div className="settings-section">
                    <div className="settings-section-header">
                      <Moon size={16} />
                      <span>Appearance</span>
                    </div>
                    <div className="settings-item">
                      <label>Theme</label>
                      <div className="theme-toggle">
                        <button 
                          onClick={toggleTheme}
                          className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                        >
                          <Sun size={16} />
                          Light
                        </button>
                        <button 
                          onClick={toggleTheme}
                          className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                        >
                          <Moon size={16} />
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Currency & Format Section */}
                  <div className="settings-section">
                    <div className="settings-section-header">
                      <DollarSign size={16} />
                      <span>Currency & Format</span>
                    </div>
                    <div className="settings-item">
                      <label>Currency</label>
                      <select 
                        value={settings.currency} 
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="settings-select"
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="settings-section">
                    <div className="settings-section-header">
                      <LogOut size={16} />
                      <span>Account</span>
                    </div>
                    <button onClick={logout} className="settings-action danger">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main">
        <div className="main-content">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              goals={goals}
              recurringTransactions={recurringTransactions}
              currency={settings.currency}
              onNavigateToTab={setActiveTab}
            />
          )}
          
          {activeTab === 'transactions' && (
            <div>
              <div className="page-header">
                <h2>Transactions</h2>
                <button 
                  onClick={() => {
                    setEditingTransaction(null);
                    setShowTransactionForm(true);
                  }}
                  className="add-button"
                >
                  <PlusCircle size={20} />
                  Add Transaction
                </button>
              </div>
              <TransactionList
                transactions={transactions}
                categories={categories}
                currency={settings.currency}
                onEdit={(transaction) => {
                  setEditingTransaction(transaction);
                  setShowTransactionForm(true);
                }}
                onDelete={handleDeleteTransaction}
              />
            </div>
          )}
          
          {activeTab === 'categories' && (
            <Categories
              categories={categories}
              onAdd={handleAddCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          )}
          
          {activeTab === 'budgets' && (
            <Budgets
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              currency={settings.currency}
              onAdd={handleAddBudget}
              onUpdate={handleUpdateBudget}
              onDelete={handleDeleteBudget}
            />
          )}
          
          {activeTab === 'recurring' && (
            <RecurringTransactions
              recurringTransactions={recurringTransactions}
              categories={categories}
              currency={settings.currency}
              onAdd={handleAddRecurringTransaction}
              onUpdate={handleUpdateRecurringTransaction}
              onDelete={handleDeleteRecurringTransaction}
              onToggleActive={handleToggleRecurringTransactionActive}
            />
          )}
          
          {activeTab === 'insights' && (
            <SpendingInsights
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              currency={settings.currency}
            />
          )}
          
          {activeTab === 'goals' && (
            <GoalTracking
              goals={goals}
              transactions={transactions}
              currency={settings.currency}
              categories={categories}
              onAdd={handleAddGoal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
              onAddTransaction={handleAddTransaction}
            />
          )}
        </div>
      </main>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="modal-overlay" onClick={() => setShowTransactionForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <TransactionForm
              transaction={editingTransaction}
              categories={categories}
              currency={settings.currency}
              onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
              onCancel={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Professional Modal System */}
      {modal.modalProps.modalType === 'alert' && (
        <Alert
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modal.modalProps.title}
          message={modal.modalProps.message}
          type={modal.modalProps.type}
        />
      )}

      {modal.modalProps.modalType === 'confirm' && (
        <Confirm
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          onConfirm={modal.confirmModal}
          title={modal.modalProps.title}
          message={modal.modalProps.message}
          confirmText={modal.modalProps.confirmText}
          cancelText={modal.modalProps.cancelText}
          type={modal.modalProps.type}
          isDestructive={modal.modalProps.isDestructive}
        />
      )}
      
      {/* Debug Panel for Development */}
      <DebugPanel />
    </div>
  );
}

// Main App component with authentication
function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// Component that handles auth state
function AppWithAuth() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return currentUser ? (
    <DataProvider>
      <AuthenticatedApp />
    </DataProvider>
  ) : <AuthForm />;
}

export default App;