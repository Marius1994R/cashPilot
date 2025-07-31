import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  AlertTriangle,
  Info,
  Filter,
  RefreshCw
} from 'lucide-react';
import { currencies } from '../utils/currencies';

function SpendingInsights({ transactions, categories, budgets, currency }) {
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chartType, setChartType] = useState('category');

  const currencyInfo = currencies.find(c => c.code === currency);

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, selectedPeriod]);

  // Calculate key metrics
  const insights = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = income - expenses;

    // Daily averages
    const days = Math.max(1, Math.ceil((new Date() - new Date(Math.min(...filteredTransactions.map(t => new Date(t.date))))) / (1000 * 60 * 60 * 24)));
    const avgDailyIncome = income / days;
    const avgDailyExpense = expenses / days;

    // Category breakdown
    const categoryBreakdown = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(t => t.categoryId === category.id);
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const count = categoryTransactions.length;
      
      return {
        ...category,
        amount,
        count,
        percentage: expenses > 0 ? (amount / (category.type === 'expense' ? expenses : income)) * 100 : 0
      };
    }).filter(cat => cat.amount > 0).sort((a, b) => b.amount - a.amount);

    // Daily spending trend
    const dailyTrend = [];
    const startDate = new Date(Math.min(...filteredTransactions.map(t => new Date(t.date))));
    const endDate = new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split('T')[0];
      const dayTransactions = filteredTransactions.filter(t => t.date === dayStr);
      const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const dayExpenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      dailyTrend.push({
        date: dayStr,
        income: dayIncome,
        expenses: dayExpenses,
        net: dayIncome - dayExpenses
      });
    }

    // Budget analysis
    const budgetAnalysis = budgets ? budgets.map(budget => {
      const categoryExpenses = filteredTransactions
        .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const category = categories.find(c => c.id === budget.categoryId);
      const periodMultiplier = selectedPeriod === 'thisMonth' || selectedPeriod === 'lastMonth' ? 1 : 
                              selectedPeriod === 'last7days' ? 0.25 : 
                              selectedPeriod === 'last30days' ? 1 : 
                              selectedPeriod === 'last90days' ? 3 : 12;

      const adjustedBudget = budget.amount * periodMultiplier;
      const usedPercentage = (categoryExpenses / adjustedBudget) * 100;

      return {
        ...budget,
        category,
        spent: categoryExpenses,
        adjustedBudget,
        usedPercentage,
        remaining: adjustedBudget - categoryExpenses,
        status: usedPercentage > 100 ? 'over' : usedPercentage > 80 ? 'warning' : 'good'
      };
    }).filter(b => b.category) : [];

    // Top spending days
    const topSpendingDays = dailyTrend
      .filter(day => day.expenses > 0)
      .sort((a, b) => b.expenses - a.expenses)
      .slice(0, 5);

    // Spending patterns
    const spendingByDayOfWeek = Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const dayOfWeek = new Date(t.date).getDay();
        spendingByDayOfWeek[dayOfWeek] += t.amount;
      });

    const weeklyPattern = spendingByDayOfWeek.map((amount, index) => ({
      day: dayNames[index],
      amount,
      dayIndex: index
    })).sort((a, b) => b.amount - a.amount);

    return {
      income,
      expenses,
      netFlow,
      avgDailyIncome,
      avgDailyExpense,
      categoryBreakdown,
      dailyTrend,
      budgetAnalysis,
      topSpendingDays,
      weeklyPattern,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, categories, budgets, selectedPeriod]);

  const periodOptions = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' }
  ];

  const chartTypeOptions = [
    { value: 'category', label: 'By Category' },
    { value: 'daily', label: 'Daily Trend' },
    { value: 'weekly', label: 'Weekly Pattern' },
    { value: 'budget', label: 'Budget Analysis' }
  ];

  const renderCategoryChart = () => {
    const maxAmount = Math.max(...insights.categoryBreakdown.map(cat => cat.amount));
    
    return (
      <div className="chart-container">
        <h3>Spending by Category</h3>
        <div className="category-chart">
          {insights.categoryBreakdown.slice(0, 8).map((category, index) => (
            <div key={category.id} className="category-bar">
              <div className="category-info">
                <div className="category-name" style={{ color: category.color }}>
                  {category.name}
                </div>
                <div className="category-amount">
                  {currencyInfo?.symbol}{category.amount.toFixed(2)}
                  <span className="category-percentage">
                    ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${(category.amount / maxAmount) * 100}%`,
                    backgroundColor: category.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDailyTrend = () => {
    const maxValue = Math.max(...insights.dailyTrend.map(day => Math.max(day.income, day.expenses)));
    
    return (
      <div className="chart-container">
        <h3>Daily Income vs Expenses</h3>
        <div className="daily-trend-chart">
          {insights.dailyTrend.slice(-14).map((day, index) => (
            <div key={day.date} className="day-column">
              <div className="day-bars">
                <div 
                  className="income-bar"
                  style={{ height: `${(day.income / maxValue) * 100}%` }}
                  title={`Income: ${currencyInfo?.symbol}${day.income.toFixed(2)}`}
                />
                <div 
                  className="expense-bar"
                  style={{ height: `${(day.expenses / maxValue) * 100}%` }}
                  title={`Expenses: ${currencyInfo?.symbol}${day.expenses.toFixed(2)}`}
                />
              </div>
              <div className="day-label">
                {new Date(day.date).getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color income"></div>
            <span>Income</span>
          </div>
          <div className="legend-item">
            <div className="legend-color expense"></div>
            <span>Expenses</span>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyPattern = () => {
    const maxAmount = Math.max(...insights.weeklyPattern.map(day => day.amount));
    
    return (
      <div className="chart-container">
        <h3>Spending Pattern by Day of Week</h3>
        <div className="weekly-pattern-chart">
          {insights.weeklyPattern.map((day, index) => (
            <div key={day.day} className="week-day-bar">
              <div className="day-info">
                <div className="day-name">{day.day}</div>
                <div className="day-amount">
                  {currencyInfo?.symbol}{day.amount.toFixed(2)}
                </div>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill weekly"
                  style={{ width: `${(day.amount / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBudgetAnalysis = () => {
    return (
      <div className="chart-container">
        <h3>Budget Performance</h3>
        <div className="budget-analysis">
          {insights.budgetAnalysis.map((budget) => (
            <div key={budget.id} className={`budget-item ${budget.status}`}>
              <div className="budget-header">
                <div className="budget-name">
                  {budget.category.name}
                </div>
                <div className="budget-percentage">
                  {budget.usedPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="budget-progress">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(budget.usedPercentage, 100)}%` }}
                />
                {budget.usedPercentage > 100 && (
                  <div 
                    className="progress-overflow"
                    style={{ width: `${budget.usedPercentage - 100}%` }}
                  />
                )}
              </div>
              <div className="budget-details">
                <span>
                  Spent: {currencyInfo?.symbol}{budget.spent.toFixed(2)}
                </span>
                <span>
                  Budget: {currencyInfo?.symbol}{budget.adjustedBudget.toFixed(2)}
                </span>
                <span className={budget.remaining >= 0 ? 'positive' : 'negative'}>
                  {budget.remaining >= 0 ? 'Remaining' : 'Over'}: {currencyInfo?.symbol}{Math.abs(budget.remaining).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'category':
        return renderCategoryChart();
      case 'daily':
        return renderDailyTrend();
      case 'weekly':
        return renderWeeklyPattern();
      case 'budget':
        return renderBudgetAnalysis();
      default:
        return renderCategoryChart();
    }
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="spending-insights">
        <div className="insights-header">
          <h2>Spending Insights</h2>
        </div>
        <div className="empty-state">
          <BarChart3 size={48} />
          <h3>No Data Available</h3>
          <p>Add some transactions to see your spending insights and trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spending-insights">
      <div className="insights-header">
        <div className="header-left">
          <h2>Spending Insights</h2>
          <p className="header-subtitle">
            Analyze your spending patterns and financial trends
          </p>
        </div>
        <div className="insights-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="insights-stats">
        <div className="stat-card income">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Income</div>
            <div className="stat-value">
              {currencyInfo?.symbol}{insights.income.toFixed(2)}
            </div>
            <div className="stat-sublabel">
              {currencyInfo?.symbol}{insights.avgDailyIncome.toFixed(2)}/day avg
            </div>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">
              {currencyInfo?.symbol}{insights.expenses.toFixed(2)}
            </div>
            <div className="stat-sublabel">
              {currencyInfo?.symbol}{insights.avgDailyExpense.toFixed(2)}/day avg
            </div>
          </div>
        </div>

        <div className={`stat-card net ${insights.netFlow >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">
            {insights.netFlow >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
          </div>
          <div className="stat-content">
            <div className="stat-label">Net Flow</div>
            <div className="stat-value">
              {insights.netFlow >= 0 ? '+' : ''}{currencyInfo?.symbol}{insights.netFlow.toFixed(2)}
            </div>
            <div className="stat-sublabel">
              {insights.transactionCount} transactions
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="chart-controls">
        <div className="chart-type-selector">
          {chartTypeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setChartType(option.value)}
              className={`chart-type-button ${chartType === option.value ? 'active' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {renderChart()}

      {/* Insights & Recommendations */}
      <div className="insights-recommendations">
        <h3>Key Insights</h3>
        <div className="insight-cards">
          {/* Top Category */}
          {insights.categoryBreakdown.length > 0 && (
            <div className="insight-card">
              <div className="insight-icon">
                <PieChart size={20} />
              </div>
              <div className="insight-content">
                <div className="insight-title">Top Spending Category</div>
                <div className="insight-text">
                  <strong>{insights.categoryBreakdown[0].name}</strong> accounts for{' '}
                  <strong>{insights.categoryBreakdown[0].percentage.toFixed(1)}%</strong> of your expenses 
                  ({currencyInfo?.symbol}{insights.categoryBreakdown[0].amount.toFixed(2)})
                </div>
              </div>
            </div>
          )}

          {/* Budget Alerts */}
          {insights.budgetAnalysis.some(b => b.status === 'over') && (
            <div className="insight-card alert">
              <div className="insight-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="insight-content">
                <div className="insight-title">Budget Alert</div>
                <div className="insight-text">
                  You've exceeded your budget in{' '}
                  <strong>{insights.budgetAnalysis.filter(b => b.status === 'over').length}</strong> categories.
                  Consider reviewing your spending or adjusting your budgets.
                </div>
              </div>
            </div>
          )}

          {/* Spending Pattern */}
          {insights.weeklyPattern.length > 0 && (
            <div className="insight-card">
              <div className="insight-icon">
                <Calendar size={20} />
              </div>
              <div className="insight-content">
                <div className="insight-title">Spending Pattern</div>
                <div className="insight-text">
                  You spend the most on <strong>{insights.weeklyPattern[0].day}s</strong>{' '}
                  ({currencyInfo?.symbol}{insights.weeklyPattern[0].amount.toFixed(2)} on average)
                </div>
              </div>
            </div>
          )}

          {/* Savings Rate */}
          {insights.income > 0 && (
            <div className="insight-card">
              <div className="insight-icon">
                <Target size={20} />
              </div>
              <div className="insight-content">
                <div className="insight-title">Savings Rate</div>
                <div className="insight-text">
                  You're saving <strong>{((insights.netFlow / insights.income) * 100).toFixed(1)}%</strong> of your income.
                  {insights.netFlow / insights.income < 0.2 && " Consider increasing your savings rate to 20% or more."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpendingInsights;