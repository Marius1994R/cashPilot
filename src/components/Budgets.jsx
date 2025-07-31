import React, { useState, useMemo, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Target, AlertTriangle } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { currencies } from '../utils/currencies';

function Budgets({ budgets, categories, transactions, currency, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly'
  });

  const currencyInfo = currencies.find(c => c.code === currency);

  const budgetProgress = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    return budgets.map(budget => {
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
        isOverBudget: currentMonthExpenses > budget.amount,
        isNearLimit: percentage >= 80 && percentage < 100
      };
    });
  }, [budgets, transactions, categories]);

  // Check if form can be submitted (required fields filled)
  const canSubmit = () => {
    const hasRequiredFields = 
      formData.categoryId !== '' &&
      formData.amount.trim() !== '';
      
    const isValidAmount = !isNaN(formData.amount) && parseFloat(formData.amount) > 0;
    
    return hasRequiredFields && isValidAmount;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      return;
    }

    // Check if budget already exists for this category
    const existingBudget = budgets.find(b => 
      b.categoryId === formData.categoryId && 
      (!editingBudget || b.id !== editingBudget.id)
    );
    
    if (existingBudget) {
      return;
    }

    const budgetData = {
      ...formData,
      amount
    };

    if (editingBudget) {
      onUpdate({ ...editingBudget, ...budgetData });
      setEditingBudget(null);
    } else {
      onAdd(budgetData);
    }

    setFormData({ categoryId: '', amount: '', period: 'monthly' });
    setShowForm(false);
  };

  const scrollToForm = () => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleAddBudget = () => {
    setShowForm(true);
    scrollToForm();
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount.toString(),
      period: budget.period
    });
    setShowForm(true);
    scrollToForm();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({ categoryId: '', amount: '', period: 'monthly' });
  };

  const handleDelete = (budget) => {
    onDelete(budget.id);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const availableCategories = expenseCategories.filter(category => 
    !budgets.some(budget => budget.categoryId === category.id) || 
    (editingBudget && editingBudget.categoryId === category.id)
  );

  return (
    <div className="budgets-page">
      <div className="page-header">
        <h2>Budgets</h2>
        <button
          onClick={handleAddBudget}
          className="add-button"
          disabled={availableCategories.length === 0 && !editingBudget}
        >
          <Plus size={20} />
          Add Budget
        </button>
      </div>

      {showForm && (
        <div className="budget-form-container" ref={formRef}>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-header">
              <h3>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h3>
              <button type="button" onClick={handleCancel} className="icon-button">
                <X size={20} />
              </button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label htmlFor="categoryId">Category *</label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {availableCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Budget Amount ({currencyInfo?.symbol}) *</label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="period">Period</label>
                <select
                  id="period"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={!canSubmit()}
                >
                  <Save size={16} />
                  {editingBudget ? 'Update' : 'Save'} Budget
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {budgetProgress.length === 0 ? (
        <div className="empty-state">
          <Target size={48} />
          <h3>No budgets set up yet</h3>
          <p>Create budgets to track your spending goals for different categories</p>
          {availableCategories.length === 0 ? (
            <p>You need to create some expense categories first</p>
          ) : (
            <button onClick={handleAddBudget} className="add-button">
              <Plus size={20} />
              Create Your First Budget
            </button>
          )}
        </div>
      ) : (
        <div className="budgets-grid">
          {budgetProgress.map(budget => (
            <div key={budget.id} className={`budget-card ${budget.isOverBudget ? 'over-budget' : budget.isNearLimit ? 'near-limit' : ''}`}>
              <div className="budget-header">
                <div className="budget-category">
                  <div 
                    className="category-dot"
                    style={{ backgroundColor: budget.categoryColor }}
                  />
                  <h3>{budget.categoryName}</h3>
                </div>
                <div className="budget-actions">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="icon-button edit-button"
                    title="Edit budget"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(budget)}
                    className="icon-button delete-button"
                    title="Delete budget"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="budget-status">
                {budget.isOverBudget && (
                  <div className="budget-alert over">
                    <AlertTriangle size={16} />
                    <span>Over Budget</span>
                  </div>
                )}
                {budget.isNearLimit && !budget.isOverBudget && (
                  <div className="budget-alert warning">
                    <AlertTriangle size={16} />
                    <span>Near Limit</span>
                  </div>
                )}
                {!budget.isOverBudget && !budget.isNearLimit && (
                  <div className="budget-alert good">
                    <Target size={16} />
                    <span>On Track</span>
                  </div>
                )}
              </div>

              <div className="budget-amounts">
                <div className="amount-row">
                  <span className="label">Spent</span>
                  <span className="value spent">
                    {currencyInfo?.symbol} {formatAmount(budget.spent)}
                  </span>
                </div>
                <div className="amount-row">
                  <span className="label">Budget</span>
                  <span className="value total">
                    {currencyInfo?.symbol} {formatAmount(budget.amount)}
                  </span>
                </div>
                <div className="amount-row">
                  <span className="label">
                    {budget.isOverBudget ? 'Over by' : 'Remaining'}
                  </span>
                  <span className={`value ${budget.isOverBudget ? 'over' : 'remaining'}`}>
                    {currencyInfo?.symbol} {formatAmount(
                      budget.isOverBudget 
                        ? budget.spent - budget.amount 
                        : budget.remaining
                    )}
                  </span>
                </div>
              </div>

              <div className="budget-progress">
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${budget.isOverBudget ? 'over' : budget.isNearLimit ? 'warning' : 'good'}`}
                    style={{ width: `${Math.min(100, budget.percentage)}%` }}
                  />
                </div>
                <div className="progress-text">
                  {budget.percentage.toFixed(1)}% used
                </div>
              </div>

              <div className="budget-period">
                <span>{budget.period === 'yearly' ? 'Yearly' : 'Monthly'} Budget</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Budgets;