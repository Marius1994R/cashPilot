import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  PieChart, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ArrowUp,
  Target,
  AlertTriangle,
  Info,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Activity,
  Grid,
  Clock,
  Lightbulb
} from 'lucide-react';
import { Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { currencies } from '../utils/currencies';

function SpendingInsights({ 
  transactions = [], 
  categories = [], 
  budgets = [], 
  currency = 'USD' 
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chartType, setChartType] = useState('category');
  const [showTips, setShowTips] = useState(true);

  const currencyInfo = currencies.find(c => c.code === currency);

  // Helper function to format amounts
  const formatAmountDetailed = (amount) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Helper function to get date range for selected period
  const getDateRange = (period) => {
    const now = new Date();
    
    switch (period) {
      case 'last7days':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
      case 'last30days':
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
      case 'last90days':
        return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
      case 'thisMonth':
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonth, end: lastMonthEnd };
      }
      case 'last3Months':
        return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: now };
      case 'last6Months':
        return { start: new Date(now.getFullYear(), now.getMonth() - 5, 1), end: now };
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      case 'lastYear': {
        const lastYear = now.getFullYear() - 1;
        return { start: new Date(lastYear, 0, 1), end: new Date(lastYear, 11, 31) };
      }
      case 'all':
        return { start: new Date(0), end: now };
      default:
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    }
  };

  // Helper function to get days in selected period
  const getDaysInPeriod = (period) => {
    const { start, end } = getDateRange(period);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  };

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    const { start, end } = getDateRange(selectedPeriod);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && 
             transactionDate <= end &&
             (selectedCategory === 'all' || t.categoryId === selectedCategory);
    });
  }, [transactions, selectedPeriod, selectedCategory]);

  // Calculate insights
  const insights = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const income = filteredTransactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpenses;

    // Category breakdown
    const categoryTotals = {};
    expenses.forEach(t => {
      const category = categories && categories.find ? categories.find(c => c.id === t.categoryId) : null;
      const categoryName = category ? category.name : 'Other';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount;
    });

    // Daily spending trend
    const dailySpending = {};
    expenses.forEach(t => {
      const date = t.date;
      dailySpending[date] = (dailySpending[date] || 0) + t.amount;
    });

    // All categories (sorted by amount)
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([name, amount]) => {
        const category = categories && categories.find ? categories.find(c => c.name === name) : null;
        return {
          name,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: category?.color || '#6b7280'
        };
      });

    // Average daily spending
    const daysInPeriod = getDaysInPeriod(selectedPeriod);
    const avgDailySpending = totalExpenses / daysInPeriod;

    // Spending velocity (transactions per day)
    const transactionVelocity = expenses.length / daysInPeriod;

    return {
      totalExpenses,
      totalIncome,
      netAmount,
      categoryTotals,
      dailySpending,
      topCategories,
      avgDailySpending,
      transactionVelocity,
      expenseCount: expenses.length,
      incomeCount: income.length
    };
  }, [filteredTransactions, categories, selectedPeriod]);

  // Chart data calculations
  const chartData = useMemo(() => {
    // Expenses by Category (for pie chart)
    const expensesByCategory = insights.topCategories.map(cat => ({
      name: cat.name,
      value: cat.amount,
      color: cat.color
    }));

    // Monthly trend (for line chart)
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 5),
      end: endOfMonth(now)
    });

    const monthlyTrend = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM yyyy'),
        income,
        expenses,
        balance: income - expenses
      };
    });

    return { expensesByCategory, monthlyTrend };
  }, [insights.topCategories, transactions]);

  // Generate spending tips
  const getSpendingTips = () => {
    const tips = [];
    
    if (insights.netAmount < 0) {
      tips.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Spending Alert',
        message: `You're spending ${currencyInfo?.symbol} ${Math.abs(insights.netAmount).toFixed(2)} more than you earn this ${selectedPeriod}.`
      });
    } else if (insights.netAmount > 0) {
      tips.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Great Job!',
        message: `You saved ${currencyInfo?.symbol} ${insights.netAmount.toFixed(2)} this ${selectedPeriod}.`
      });
    }

    if (insights.topCategories.length > 0) {
      const topCategory = insights.topCategories[0];
      if (topCategory.percentage > 40) {
        tips.push({
          type: 'info',
          icon: PieChart,
          title: 'Category Focus',
          message: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(1)}% of your spending. Consider if this aligns with your priorities.`
        });
      }
    }

    if (insights.avgDailySpending > 0) {
      tips.push({
        type: 'info',
        icon: Target,
        title: 'Daily Average',
        message: `You spend an average of ${currencyInfo?.symbol} ${insights.avgDailySpending.toFixed(2)} per day.`
      });
    }

    return tips;
  };

  const spendingTips = getSpendingTips();

  // Export functionality
  const exportReport = () => {
    const periodLabels = {
      'last7days': 'Last 7 Days',
      'last30days': 'Last 30 Days', 
      'last90days': 'Last 90 Days',
      'thisMonth': 'This Month',
      'lastMonth': 'Last Month',
      'last3Months': 'Last 3 Months',
      'last6Months': 'Last 6 Months',
      'thisYear': 'This Year',
      'lastYear': 'Last Year',
      'all': 'All Time'
    };

    const reportContent = {
      title: 'Financial Insights & Reports',
      period: periodLabels[selectedPeriod] || selectedPeriod,
      generatedAt: new Date().toISOString(),
      currency: currency,
      summary: {
        totalIncome: insights.totalIncome,
        totalExpenses: insights.totalExpenses,
        netAmount: insights.netAmount,
        transactionCount: filteredTransactions.length,
        expenseCount: insights.expenseCount,
        incomeCount: insights.incomeCount,
        avgDailySpending: insights.avgDailySpending,
        transactionVelocity: insights.transactionVelocity
      },
      categoryBreakdown: insights.topCategories,
      spendingTips: spendingTips,
      transactions: filteredTransactions
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-insights-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chart component for category breakdown
  const CategoryChart = ({ data }) => {
    const maxAmount = Math.max(...data.map(item => item.amount));
    
    return (
      <div className="category-chart">
        {data.map((item, index) => (
          <div key={index} className="chart-item">
            <div className="chart-bar-container">
              <div className="chart-label">
                <div className="category-indicator" style={{ backgroundColor: item.color }}></div>
                <span className="category-name">{item.name}</span>
                <span className="category-percentage">{item.percentage.toFixed(1)}%</span>
              </div>
              <div className="chart-bar-track">
                <div 
                  className="chart-bar-fill" 
                  style={{ 
                    width: `${(item.amount / maxAmount) * 100}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
              <span className="chart-amount">
                {currencyInfo?.symbol}{item.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Daily spending chart
  const DailySpendingChart = ({ data }) => {
    const [hoveredBar, setHoveredBar] = useState(null);
    
    const sortedData = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14); // Show last 14 days
    
    const maxAmount = Math.max(...sortedData.map(([, amount]) => amount));
    
    return (
      <div className="daily-chart">
        <div className="chart-grid">
          {sortedData.map(([date, amount], index) => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            
            return (
              <div 
                key={index} 
                className="daily-bar-container"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div 
                  className="daily-bar" 
                  style={{ 
                    height: `${maxAmount > 0 ? (amount / maxAmount) * 100 : 0}%` 
                  }}
                ></div>
                {hoveredBar === index && (
                  <div className="daily-tooltip tooltip-below">
                    {currencyInfo?.symbol}{amount.toFixed(2)}
                  </div>
                )}
                <div className="daily-label">
                  <div className="day-name">{dayName}</div>
                  <div className="day-num">{dayNum}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="spending-insights">
      <div className="insights-header">
        <div className="header-left">
          <h2>Insights</h2>
        </div>
      </div>

      <div className="insights-controls">
        <div className="controls-left">
          <div className="control-group">
            <label>Period:</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-select"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="control-group">
            <label>Category:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {categories && categories.filter ? categories.filter(c => c.type === 'expense').map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              )) : []}
            </select>
          </div>
        </div>
        <div className="controls-right">
          <button 
            onClick={exportReport} 
            className="export-button"
            title="Export detailed financial report"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Most Expensive Day</div>
              <div className="stat-value">
                {Object.entries(insights.dailySpending).length > 0 
                  ? (() => {
                      const [date, amount] = Object.entries(insights.dailySpending)
                        .sort(([,a], [,b]) => b - a)[0];
                      return `${currencyInfo?.symbol} ${amount.toFixed(2)}`;
                    })()
                  : 'No data'
                }
              </div>
              <div className="stat-detail">
                {Object.entries(insights.dailySpending).length > 0 
                  ? (() => {
                      const [date] = Object.entries(insights.dailySpending)
                        .sort(([,a], [,b]) => b - a)[0];
                      return new Date(date).toLocaleDateString();
                    })()
                  : ''
                }
              </div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Grid size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Top Spending Category</div>
              <div className="stat-value">
                {Object.keys(insights.categoryTotals).length > 0 
                  ? (() => {
                      const topCategory = Object.entries(insights.categoryTotals)
                        .sort(([,a], [,b]) => b - a)[0];
                      return `${currencyInfo?.symbol} ${topCategory[1].toFixed(2)}`;
                    })()
                  : 'No data'
                }
              </div>
              <div className="stat-detail">
                {Object.keys(insights.categoryTotals).length > 0 
                  ? (() => {
                      const topCategoryName = Object.entries(insights.categoryTotals)
                        .sort(([,a], [,b]) => b - a)[0][0];
                      return topCategoryName;
                    })()
                  : ''
                }
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Largest Expense</div>
              <div className="stat-value">
                {filteredTransactions.filter(t => t.type === 'expense').length > 0 
                  ? (() => {
                      const largestExpense = filteredTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((max, t) => 
                          t.amount > max.amount ? t : max
                        );
                      return `${currencyInfo?.symbol} ${largestExpense.amount.toFixed(2)}`;
                    })()
                  : 'No data'
                }
              </div>
              <div className="stat-detail">
                {filteredTransactions.filter(t => t.type === 'expense').length > 0 
                  ? (() => {
                      const largestExpense = filteredTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((max, t) => 
                          t.amount > max.amount ? t : max
                        );
                      return largestExpense.description;
                    })()
                  : ''
                }
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <BarChart size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Average Daily Spending</div>
              <div className="stat-value">
                {filteredTransactions.filter(t => t.type === 'expense').length > 0 
                  ? (() => {
                      const expenses = filteredTransactions.filter(t => t.type === 'expense');
                      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
                      const uniqueDays = new Set(expenses.map(t => new Date(t.date).toDateString())).size;
                      const avgDaily = uniqueDays > 0 ? totalExpenses / uniqueDays : 0;
                      return `${currencyInfo?.symbol} ${avgDaily.toFixed(2)}`;
                    })()
                  : 'No data'
                }
              </div>
              <div className="stat-detail">
                per day average
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Monthly Growth</div>
              <div className="stat-value">
                {(() => {
                  const currentMonth = new Date();
                  const previousMonth = subMonths(currentMonth, 1);
                  
                  const currentMonthExpenses = transactions
                    .filter(t => t.type === 'expense' && 
                      new Date(t.date).getMonth() === currentMonth.getMonth() &&
                      new Date(t.date).getFullYear() === currentMonth.getFullYear())
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                  const previousMonthExpenses = transactions
                    .filter(t => t.type === 'expense' && 
                      new Date(t.date).getMonth() === previousMonth.getMonth() &&
                      new Date(t.date).getFullYear() === previousMonth.getFullYear())
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                  if (previousMonthExpenses === 0) return 'No data';
                  
                  const growth = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
                  const sign = growth >= 0 ? '+' : '';
                  return `${sign}${growth.toFixed(1)}%`;
                })()}
              </div>
              <div className="stat-detail">
                vs last month
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Most Active Day</div>
              <div className="stat-value">
                {filteredTransactions.length > 0 
                  ? (() => {
                      const dayCount = {};
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      
                      filteredTransactions.forEach(t => {
                        const dayOfWeek = new Date(t.date).getDay();
                        const dayName = dayNames[dayOfWeek];
                        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
                      });
                      
                      const mostActiveDay = Object.entries(dayCount)
                        .sort(([,a], [,b]) => b - a)[0];
                      
                      return mostActiveDay ? mostActiveDay[0] : 'No data';
                    })()
                  : 'No data'
                }
              </div>
              <div className="stat-detail">
                {filteredTransactions.length > 0 
                  ? (() => {
                      const dayCount = {};
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      
                      filteredTransactions.forEach(t => {
                        const dayOfWeek = new Date(t.date).getDay();
                        const dayName = dayNames[dayOfWeek];
                        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
                      });
                      
                      const mostActiveDay = Object.entries(dayCount)
                        .sort(([,a], [,b]) => b - a)[0];
                      
                      return mostActiveDay ? `${mostActiveDay[1]} transactions` : '';
                    })()
                  : ''
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Tips */}
      {showTips && spendingTips.length > 0 && (
        <div className="tips-section">
          <div className="tips-header">
            <h3>
              <Lightbulb size={20} />
              Insights & Tips
            </h3>
          </div>
          <div className="tips-grid">
            {spendingTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className={`tip-card ${tip.type}`}>
                  <div className="tip-icon">
                    <Icon size={20} />
                  </div>
                  <div className="tip-content">
                    <h4>{tip.title}</h4>
                    <p>{tip.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!showTips && (
        <button 
          onClick={() => setShowTips(true)}
          className="show-tips-button"
        >
          <Eye size={16} />
          Show Insights & Tips
        </button>
      )}

      {/* Financial Overview Charts */}
      <div className="charts-grid">
        {/* Expenses by Category */}
        {chartData.expensesByCategory.length > 0 && (
          <div className="chart-card">
            <h3>Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData.expensesByCategory}
                margin={{ top: 20, right: 30, left: 80, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(value) => `${currencyInfo?.symbol}${formatAmountDetailed(value)}`}
                />
                <Tooltip 
                  formatter={(value) => [`${currencyInfo?.symbol} ${formatAmountDetailed(value)}`, 'Amount']}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="value">
                  {chartData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Trend */}
        {chartData.monthlyTrend.length > 0 && (
          <div className="chart-card">
            <h3>6-Month Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${currencyInfo?.symbol} ${formatAmountDetailed(value)}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Category Breakdown */}
        <div className="chart-section">
          <div className="section-header">
            <h3>
              <PieChart size={20} />
              Top Categories
            </h3>
            <div className="chart-info">
              <Info size={16} />
              <span>Based on total spending</span>
            </div>
          </div>
          {insights.topCategories.length > 0 ? (
            <CategoryChart data={insights.topCategories} />
          ) : (
            <div className="empty-chart">
              <PieChart size={48} />
              <p>No expenses found for this period</p>
            </div>
          )}
        </div>

        {/* Daily Spending Trend */}
        <div className="chart-section">
          <div className="section-header">
            <h3>
              <BarChart3 size={20} />
              Daily Spending Trend
            </h3>
            <div className="chart-info">
              <Info size={16} />
              <span>Last 14 days</span>
            </div>
          </div>
          {Object.keys(insights.dailySpending).length > 0 ? (
            <DailySpendingChart data={insights.dailySpending} />
          ) : (
            <div className="empty-chart">
              <BarChart3 size={48} />
              <p>No daily spending data available</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

export default SpendingInsights;