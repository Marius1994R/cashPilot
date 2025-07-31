import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, Filter, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { currencies } from '../utils/currencies';

function TransactionList({ transactions, categories, currency, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const currencyInfo = currencies.find(c => c.code === currency);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = filterCategory === 'all' || transaction.categoryId === filterCategory;
      
      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== 'all') {
        const transactionDate = new Date(transaction.date);
        const [year, month] = selectedMonth.split('-');
        const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const monthEnd = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        matchesMonth = transactionDate >= monthStart && transactionDate <= monthEnd;
      }
      
      return matchesSearch && matchesType && matchesCategory && matchesMonth;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, sortBy, sortOrder, selectedMonth]);

  // Display logic for transaction list
  const displayedTransactions = useMemo(() => {
    return showAllTransactions ? filteredAndSortedTransactions : filteredAndSortedTransactions.slice(0, 10);
  }, [filteredAndSortedTransactions, showAllTransactions]);

  // Generate available months based on transactions
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a)); // Most recent first
    return [
      { value: 'all', label: 'All Months' },
      ...sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return {
          value: month,
          label: format(date, 'MMMM yyyy')
        };
      })
    ];
  }, [transactions]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6b7280';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalIncome = filteredAndSortedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredAndSortedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="transaction-list">
      {/* Filters and Search */}
      <div className="transaction-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <div className="month-filter">
            <Calendar size={16} />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setShowAllTransactions(false); // Reset show all when changing month
              }}
            >
              {availableMonths.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
            <option value="description-asc">Description (A-Z)</option>
            <option value="description-desc">Description (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="transaction-summary">
        <div className="summary-item income">
          <TrendingUp size={20} />
          <div>
            <span className="label">Income</span>
            <span className="amount">
              {currencyInfo?.symbol} {formatAmount(totalIncome)}
            </span>
          </div>
        </div>
        <div className="summary-item expense">
          <TrendingDown size={20} />
          <div>
            <span className="label">Expenses</span>
            <span className="amount">
              {currencyInfo?.symbol} {formatAmount(totalExpenses)}
            </span>
          </div>
        </div>
        <div className={`summary-item balance ${balance >= 0 ? 'positive' : 'negative'}`}>
          <div>
            <span className="label">Balance</span>
            <span className="amount">
              {currencyInfo?.symbol} {formatAmount(balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      {filteredAndSortedTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
          {searchTerm || filterType !== 'all' || filterCategory !== 'all' || selectedMonth !== 'all' ? (
            <p>Try adjusting your search or filters</p>
          ) : (
            <p>Start by adding your first transaction</p>
          )}
        </div>
      ) : (
        <>
          <div className="transactions">
            {displayedTransactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-main">
                <div 
                  className="category-indicator"
                  style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                />
                <div className="transaction-details">
                  <div className="transaction-header">
                    <h4>{transaction.description}</h4>
                    <span className={`amount ${transaction.type}`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {currencyInfo?.symbol} {formatAmount(transaction.amount)}
                    </span>
                  </div>
                  <div className="transaction-meta">
                    <span className="category">{getCategoryName(transaction.categoryId)}</span>
                    <span className="date">{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                  </div>
                  {transaction.notes && (
                    <p className="transaction-notes">{transaction.notes}</p>
                  )}
                </div>
              </div>
              <div className="transaction-actions">
                <button
                  onClick={() => onEdit(transaction)}
                  className="icon-button edit-button"
                  title="Edit transaction"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="icon-button delete-button"
                  title="Delete transaction"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          </div>
          
          {/* Show More Button */}
          {filteredAndSortedTransactions.length > 10 && (
            <div className="show-more-container">
              <button 
                className="show-more-btn"
                onClick={() => setShowAllTransactions(!showAllTransactions)}
              >
                {showAllTransactions ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    <span>Show All ({filteredAndSortedTransactions.length})</span>
                    <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TransactionList;