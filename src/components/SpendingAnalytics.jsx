import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Filter,
  Target,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  DollarSign
} from 'lucide-react';
import { currencies } from '../utils/currencies';

function SpendingAnalytics({ transactions, categories, currency }) {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chartType, setChartType] = useState('category');

  const currencyInfo = currencies.find(c => c.code === currency);

  // Date range calculations
  const getDateRange = (range) => {
    const today = new Date();
    const start = new Date();
    
    switch (range) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setDate(today.getDate() - 30);
        break;
      case 'quarter':
        start.setDate(today.getDate() - 90);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start.setDate(today.getDate() - 30);
    }
    
    return { start, end: today };
  };

  // Filter transactions by date range and category
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange(timeRange);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const isInRange = transactionDate >= start && transactionDate <= end;
      const matchesCategory = selectedCategory === 'all' || transaction.categoryId === selectedCategory;
      
      return isInRange && matchesCategory;
    });
  }, [transactions, timeRange, selectedCategory]);

  // Calculate spending insights
  const insights = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const income = filteredTransactions.filter(t => t.type === 'income');
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpenses;
    
    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category ? category.name : 'Unknown';
      const categoryColor = category ? category.color : '#64748b';
      
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          amount: 0,
          count: 0,
          color: categoryColor
        };
      }
      categoryBreakdown[categoryName].amount += transaction.amount;
      categoryBreakdown[categoryName].count += 1;
    });

    // Daily spending trend
    const dailySpending = {};
    const { start } = getDateRange(timeRange);
    
    for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailySpending[dateKey] = { expenses: 0, income: 0 };
    }
    
    filteredTransactions.forEach(transaction => {
      const dateKey = transaction.date;
      if (dailySpending[dateKey]) {
        if (transaction.type === 'expense') {
          dailySpending[dateKey].expenses += transaction.amount;
        } else {
          dailySpending[dateKey].income += transaction.amount;
        }
      }
    });

    // Calculate averages
    const daysInRange = Object.keys(dailySpending).length;
    const avgDailyExpenses = totalExpenses / daysInRange;
    const avgDailyIncome = totalIncome / daysInRange;

    // Find top spending categories
    const topCategories = Object.entries(categoryBreakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate spending velocity (recent vs earlier period)
    const midPoint = new Date(start.getTime() + (new Date().getTime() - start.getTime()) / 2);
    const recentExpenses = expenses.filter(t => new Date(t.date) >= midPoint);
    const earlierExpenses = expenses.filter(t => new Date(t.date) < midPoint);
    
    const recentTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const earlierTotal = earlierExpenses.reduce((sum, t) => sum + t.amount, 0);
    const spendingChange = recentTotal - earlierTotal;
    const spendingChangePercent = earlierTotal > 0 ? (spendingChange / earlierTotal) * 100 : 0;

    return {
      totalExpenses,
      totalIncome,
      netAmount,
      avgDailyExpenses,
      avgDailyIncome,
      categoryBreakdown,
      topCategories,
      dailySpending,
      spendingChange,
      spendingChangePercent,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, categories, timeRange]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (chartType === 'category') {
      return insights.topCategories.map(cat => ({
        name: cat.name,
        value: cat.amount,
        color: cat.color,
        count: cat.count
      }));
    } else if (chartType === 'trend') {
      return Object.entries(insights.dailySpending).map(([date, amounts]) => ({
        date,
        expenses: amounts.expenses,
        income: amounts.income,
        net: amounts.income - amounts.expenses
      }));
    }
    return [];
  }, [chartType, insights]);

  const formatCurrency = (amount) => {
    return `${currencyInfo?.symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key] || 0));
  };

  return (
    <div className="spending-insights">
      <div className="insights-header">
        <div className="header-left">
          <h2>Spending Analytics</h2>
          <p className="header-subtitle">
            Analyze your spending patterns and trends
          </p>
        </div>
        
        <div className="insights-controls">
          <div className="control-group">
            <label>Time Range</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="control-select"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="control-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label>Chart Type</label>
            <select 
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              className="control-select"
            >
              <option value="category">By Category</option>
              <option value="trend">Trend Over Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="insights-summary">
        <div className="summary-card">
          <div className="summary-header">
            <TrendingDown className="summary-icon expense" />
            <span className="summary-label">Total Expenses</span>
          </div>
          <div className="summary-value expense">
            {formatCurrency(insights.totalExpenses)}
          </div>
          <div className="summary-detail">
            {insights.transactionCount} transactions
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-header">
            <TrendingUp className="summary-icon income" />
            <span className="summary-label">Total Income</span>
          </div>
          <div className="summary-value income">
            {formatCurrency(insights.totalIncome)}
          </div>
          <div className="summary-detail">
            Avg: {formatCurrency(insights.avgDailyIncome)}/day
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-header">
            <DollarSign className={`summary-icon ${insights.netAmount >= 0 ? 'income' : 'expense'}`} />
            <span className="summary-label">Net Amount</span>
          </div>
          <div className={`summary-value ${insights.netAmount >= 0 ? 'income' : 'expense'}`}>
            {insights.netAmount >= 0 ? '+' : '-'}{formatCurrency(insights.netAmount)}
          </div>
          <div className="summary-detail">
            Avg: {formatCurrency(insights.avgDailyExpenses)}/day spent
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-header">
            {insights.spendingChangePercent >= 0 ? (
              <ArrowUp className="summary-icon expense" />
            ) : (
              <ArrowDown className="summary-icon income" />
            )}
            <span className="summary-label">Spending Change</span>
          </div>
          <div className={`summary-value ${insights.spendingChangePercent >= 0 ? 'expense' : 'income'}`}>
            {insights.spendingChangePercent >= 0 ? '+' : ''}{insights.spendingChangePercent.toFixed(1)}%
          </div>
          <div className="summary-detail">
            vs previous period
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {chartType === 'category' && chartData.length > 0 && (
          <div className="chart-container">
            <h3 className="chart-title">
              <PieChart size={20} />
              Spending by Category
            </h3>
            
            <div className="category-chart">
              <div className="category-bars">
                {chartData.map((item, index) => {
                  const percentage = (item.value / insights.totalExpenses) * 100;
                  return (
                    <div key={item.name} className="category-bar-item">
                      <div className="category-info">
                        <div className="category-name-section">
                          <div 
                            className="category-color" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="category-name">{item.name}</span>
                        </div>
                        <div className="category-values">
                          <span className="category-amount">
                            {formatCurrency(item.value)}
                          </span>
                          <span className="category-percentage">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="category-bar-track">
                        <div 
                          className="category-bar-fill"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                      <div className="category-transactions">
                        {item.count} transaction{item.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {chartType === 'trend' && chartData.length > 0 && (
          <div className="chart-container">
            <h3 className="chart-title">
              <BarChart3 size={20} />
              Spending Trend
            </h3>
            
            <div className="trend-chart">
              <div className="trend-bars">
                {chartData.map((item, index) => {
                  const maxExpense = getMaxValue(chartData, 'expenses');
                  const maxIncome = getMaxValue(chartData, 'income');
                  const maxValue = Math.max(maxExpense, maxIncome);
                  
                  const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * 100 : 0;
                  const incomeHeight = maxValue > 0 ? (item.income / maxValue) * 100 : 0;
                  
                  return (
                    <div key={item.date} className="trend-bar-item">
                      <div className="trend-bars-group">
                        <div 
                          className="trend-bar expense"
                          style={{ height: `${expenseHeight}%` }}
                          title={`Expenses: ${formatCurrency(item.expenses)}`}
                        ></div>
                        <div 
                          className="trend-bar income"
                          style={{ height: `${incomeHeight}%` }}
                          title={`Income: ${formatCurrency(item.income)}`}
                        ></div>
                      </div>
                      <div className="trend-date">
                        {formatDate(item.date)}
                      </div>
                      <div className="trend-net">
                        <span className={item.net >= 0 ? 'positive' : 'negative'}>
                          {item.net >= 0 ? '+' : ''}{formatCurrency(item.net)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="trend-legend">
                <div className="legend-item">
                  <div className="legend-color expense"></div>
                  <span>Expenses</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color income"></div>
                  <span>Income</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights & Recommendations */}
      <div className="insights-recommendations">
        <h3 className="recommendations-title">
          <Target size={20} />
          Insights & Recommendations
        </h3>
        
        <div className="recommendations-list">
          {insights.spendingChangePercent > 20 && (
            <div className="recommendation-item warning">
              <AlertTriangle size={16} />
              <div className="recommendation-content">
                <strong>High Spending Alert</strong>
                <p>Your spending has increased by {insights.spendingChangePercent.toFixed(1)}% compared to the previous period. Consider reviewing your recent expenses.</p>
              </div>
            </div>
          )}
          
          {insights.topCategories.length > 0 && (
            <div className="recommendation-item info">
              <BarChart3 size={16} />
              <div className="recommendation-content">
                <strong>Top Spending Category</strong>
                <p>You spent the most on <strong>{insights.topCategories[0].name}</strong> ({formatCurrency(insights.topCategories[0].amount)}). This represents {((insights.topCategories[0].amount / insights.totalExpenses) * 100).toFixed(1)}% of your total expenses.</p>
              </div>
            </div>
          )}
          
          {insights.netAmount < 0 && (
            <div className="recommendation-item warning">
              <TrendingDown size={16} />
              <div className="recommendation-content">
                <strong>Spending Exceeds Income</strong>
                <p>Your expenses exceed your income by {formatCurrency(Math.abs(insights.netAmount))}. Consider creating a budget or reducing discretionary spending.</p>
              </div>
            </div>
          )}
          
          {insights.avgDailyExpenses > 0 && (
            <div className="recommendation-item success">
              <Calendar size={16} />
              <div className="recommendation-content">
                <strong>Daily Spending Average</strong>
                <p>You spend an average of {formatCurrency(insights.avgDailyExpenses)} per day. Setting a daily spending limit could help you stay on track.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="empty-state">
          <BarChart3 size={48} />
          <h3>No Data for Selected Period</h3>
          <p>Try selecting a different time range or category to view insights.</p>
        </div>
      )}
    </div>
  );
}

export default SpendingAnalytics;