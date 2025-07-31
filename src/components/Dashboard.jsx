import React, { useMemo, useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, ChevronDown, ChevronUp, Eye, CheckCircle, AlertTriangle, Repeat } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { currencies } from '../utils/currencies';

function Dashboard({ transactions, categories, budgets, goals, recurringTransactions, currency, onNavigateToTab }) {
  const [showAllBudgets, setShowAllBudgets] = useState(false);
  const budgetSectionRef = useRef(null);
  const currencyInfo = currencies.find(c => c.code === currency);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Filter transactions for different periods
    const last30Days = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const currentMonth = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    // Calculate totals
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentMonthIncome = currentMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentMonthExpenses = currentMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBalance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      currentMonthIncome,
      currentMonthExpenses,
      currentMonthBalance: currentMonthIncome - currentMonthExpenses,
      transactionCount: transactions.length,
      last30DaysCount: last30Days.length
    };
  }, [transactions]);



  // Budget progress with priority sorting
  const budgetProgress = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const progressData = budgets.map(budget => {
      const currentMonthExpenses = transactions
        .filter(t => 
          t.type === 'expense' && 
          t.categoryId === budget.categoryId &&
          new Date(t.date) >= currentMonthStart &&
          new Date(t.date) <= currentMonthEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const category = categories.find(c => c.id === budget.categoryId);
      const percentage = budget.amount > 0 ? (currentMonthExpenses / budget.amount) * 100 : 0;

      return {
        ...budget,
        categoryName: category ? category.name : 'Unknown',
        categoryColor: category ? category.color : '#6b7280',
        spent: currentMonthExpenses,
        remaining: Math.max(0, budget.amount - currentMonthExpenses),
        percentage: Math.min(100, percentage),
        isOverBudget: currentMonthExpenses > budget.amount
      };
    });

    // Sort: over budget first, then by percentage descending
    return progressData.sort((a, b) => {
      if (a.isOverBudget && !b.isOverBudget) return -1;
      if (!a.isOverBudget && b.isOverBudget) return 1;
      return b.percentage - a.percentage;
    });
  }, [budgets, transactions, categories]);

  // Display logic for budget cards
  const displayedBudgets = useMemo(() => {
    return showAllBudgets ? budgetProgress : budgetProgress.slice(0, 3);
  }, [budgetProgress, showAllBudgets]);

  // Goals summary stats
  const goalsSummary = useMemo(() => {
    if (!goals || goals.length === 0) return null;

    const activeGoals = goals.filter(goal => goal.isActive);
    const completedGoals = goals.filter(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      return progress >= 100;
    });

    const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    // Calculate urgent goals (due within 30 days)
    const today = new Date();
    const urgentGoals = activeGoals.filter(goal => {
      const targetDate = new Date(goal.targetDate);
      const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 30 && daysRemaining > 0;
    });

    return {
      total: goals.length,
      active: activeGoals.length,
      completed: completedGoals.length,
      overallProgress: Math.min(overallProgress, 100),
      totalCurrentAmount,
      totalTargetAmount,
      urgentCount: urgentGoals.length
    };
  }, [goals]);

  // Recent recurring transactions
  const upcomingRecurring = useMemo(() => {
    if (!recurringTransactions || recurringTransactions.length === 0) return [];
    
    return recurringTransactions
      .filter(rt => rt.isActive)
      .slice(0, 3)
      .map(rt => {
        const category = categories.find(c => c.id === rt.categoryId);
        return {
          ...rt,
          categoryName: category ? category.name : 'Unknown',
          categoryColor: category ? category.color : '#6b7280'
        };
      });
  }, [recurringTransactions, categories]);

  // Scroll to budget section when expanding
  useEffect(() => {
    if (showAllBudgets && budgetSectionRef.current) {
      // Wait a bit for the content to render, then scroll
      setTimeout(() => {
        const section = budgetSectionRef.current;
        const sectionBottom = section.offsetTop + section.offsetHeight;
        const windowHeight = window.innerHeight;
        const currentScroll = window.pageYOffset;
        
        // Only scroll if the bottom of the section is not visible
        if (sectionBottom > currentScroll + windowHeight) {
          section.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end' 
          });
        }
      }, 100);
    }
  }, [showAllBudgets]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAmountDetailed = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="date-info">
          <Calendar size={16} />
          <span>{format(new Date(), 'MMMM yyyy')}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card income">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Monthly Income</div>
            <div className="metric-value">
              {currencyInfo?.symbol} {formatAmount(stats.currentMonthIncome)}
            </div>
            <div className="metric-detail">
              This month
            </div>
          </div>
        </div>

        <div className="metric-card expense">
          <div className="metric-icon">
            <TrendingDown size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Monthly Expenses</div>
            <div className="metric-value">
              {currencyInfo?.symbol} {formatAmount(stats.currentMonthExpenses)}
            </div>
            <div className="metric-detail">
              This month
            </div>
          </div>
        </div>

        <div className={`metric-card balance ${stats.totalBalance >= 0 ? 'positive' : 'negative'}`}>
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Balance</div>
            <div className="metric-value">
              {stats.totalBalance >= 0 ? '+' : ''}{currencyInfo?.symbol} {formatAmount(Math.abs(stats.totalBalance))}
            </div>
            <div className="metric-detail">
              All time
            </div>
          </div>
        </div>

        <div className="metric-card transactions">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Transactions</div>
            <div className="metric-value">
              {stats.transactionCount}
            </div>
            <div className="metric-detail">
              {stats.last30DaysCount} in last 30 days
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="recent-transactions">
          <h3>Recent Transactions</h3>
          <div className="transactions-preview">
            {transactions.slice(0, 5).map(transaction => {
              const category = categories.find(c => c.id === transaction.categoryId);
              return (
                <div key={transaction.id} className="transaction-preview-item">
                  <div 
                    className="category-indicator"
                    style={{ backgroundColor: category?.color || '#6b7280' }}
                  />
                  <div className="transaction-info">
                    <span className="description">{transaction.description}</span>
                    <span className="date">{format(new Date(transaction.date), 'MMM dd')}</span>
                  </div>
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {currencyInfo?.symbol} {formatAmountDetailed(transaction.amount)}
                  </span>
                </div>
              );
            })}
          </div>
          {transactions.length > 5 && (
            <div className="show-more-container">
              <button 
                className="show-more-btn"
                onClick={() => onNavigateToTab('transactions')}
              >
                <span>See All Transactions</span>
                <Eye size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Budget Progress */}
      {budgetProgress.length > 0 && (
        <div className="budget-progress-section" ref={budgetSectionRef}>
          <h3>Budget Progress (This Month)</h3>
          <div className="budget-progress-grid">
            {displayedBudgets.map(budget => (
              <div key={budget.id} className="budget-progress-card">
                <div className="budget-header">
                  <div className="budget-category">
                    <div 
                      className="category-dot"
                      style={{ backgroundColor: budget.categoryColor }}
                    />
                    <span>{budget.categoryName}</span>
                  </div>
                  <span className={`budget-status ${budget.isOverBudget ? 'over' : 'under'}`}>
                    {budget.isOverBudget ? 'Over Budget' : 'On Track'}
                  </span>
                </div>
                <div className="budget-amounts">
                  <div className="budget-spent">
                    <span>Spent: {currencyInfo?.symbol} {formatAmountDetailed(budget.spent)}</span>
                  </div>
                  <div className="budget-total">
                    <span>Budget: {currencyInfo?.symbol} {formatAmountDetailed(budget.amount)}</span>
                  </div>
                </div>
                <div className="budget-progress-bar">
                  <div 
                    className={`budget-progress-fill ${budget.isOverBudget ? 'over' : ''}`}
                    style={{ width: `${Math.min(100, budget.percentage)}%` }}
                  />
                </div>
                <div className="budget-percentage">
                  {budget.percentage.toFixed(1)}% used
                </div>
              </div>
            ))}
          </div>
          {budgetProgress.length > 3 && (
            <div className="show-more-container">
              <button 
                className="show-more-btn"
                onClick={() => setShowAllBudgets(!showAllBudgets)}
              >
                {showAllBudgets ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    <span>Show All ({budgetProgress.length})</span>
                    <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Goals Summary */}
      {goalsSummary && (
        <div className="goals-summary-section">
          <h3>Financial Goals</h3>
          <div className="goals-summary-grid">
            <div className="goals-summary-card">
              <div className="summary-stat">
                <div className="stat-icon">
                  <Target size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Goals</span>
                  <span className="stat-value">{goalsSummary.total}</span>
                </div>
              </div>
            </div>
            <div className="goals-summary-card">
              <div className="summary-stat">
                <div className="stat-icon completed">
                  <CheckCircle size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{goalsSummary.completed}</span>
                </div>
              </div>
            </div>
            <div className="goals-summary-card">
              <div className="summary-stat">
                <div className="stat-icon">
                  <DollarSign size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Progress</span>
                  <span className="stat-value">{goalsSummary.overallProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            {goalsSummary.urgentCount > 0 && (
              <div className="goals-summary-card urgent">
                <div className="summary-stat">
                  <div className="stat-icon urgent">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Due Soon</span>
                    <span className="stat-value">{goalsSummary.urgentCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="show-more-container">
            <button 
              className="show-more-btn"
              onClick={() => onNavigateToTab('goals')}
            >
              <span>Manage Goals</span>
              <Eye size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Recurring Transactions */}
      {upcomingRecurring.length > 0 && (
        <div className="recurring-transactions-section">
          <h3>Recurring Transactions</h3>
          <div className="recurring-preview">
            {upcomingRecurring.map(recurring => (
              <div key={recurring.id} className="recurring-preview-item">
                <div className="recurring-icon">
                  <Repeat size={16} />
                </div>
                <div 
                  className="category-indicator"
                  style={{ backgroundColor: recurring.categoryColor }}
                />
                <div className="recurring-info">
                  <span className="description">{recurring.description}</span>
                  <span className="frequency">{recurring.frequency}</span>
                </div>
                <span className={`amount ${recurring.type}`}>
                  {recurring.type === 'expense' ? '-' : '+'}
                  {currencyInfo?.symbol} {formatAmountDetailed(recurring.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="show-more-container">
            <button 
              className="show-more-btn"
              onClick={() => onNavigateToTab('recurring')}
            >
              <span>Manage Recurring</span>
              <Eye size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;