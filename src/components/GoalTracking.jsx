import React, { useState, useEffect, useRef } from 'react';
import Confirm from './Confirm';
import Modal from './Modal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Zap,
  Star,
  TrendingDown,
  ArrowRight,
  Loader2,
  AlertCircle,
  Flag
} from 'lucide-react';
import { currencies } from '../utils/currencies';

// Format large numbers with K, M abbreviations
const formatLargeNumber = (num, maxDecimals = 2) => {
  // Round to max 2 decimal places first
  const rounded = Math.round(num * 100) / 100;
  
  if (rounded >= 1000000) {
    const millions = rounded / 1000000;
    return millions % 1 === 0 ? millions + 'M' : millions.toFixed(1) + 'M';
  }
  if (rounded >= 1000) {
    const thousands = rounded / 1000;
    return thousands % 1 === 0 ? thousands + 'k' : thousands.toFixed(1) + 'k';
  }
  
  // For numbers under 1000, show max 2 decimal places and remove trailing zeros
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(maxDecimals).replace(/\.?0+$/, '');
};

function GoalTracking({ goals, transactions, currency, categories, onAdd, onUpdate, onDelete, onAddTransaction }) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const formRef = useRef(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [displayedGoalsCount, setDisplayedGoalsCount] = useState(5);
  const [showReminders, setShowReminders] = useState(false);
  const [reminderGoals, setReminderGoals] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'savings',
    priority: 'medium',
    isActive: true,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const currencyInfo = currencies.find(c => c.code === currency);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        description: editingGoal.description || '',
        targetAmount: editingGoal.targetAmount.toString(),
        currentAmount: editingGoal.currentAmount.toString(),
        targetDate: editingGoal.targetDate,
        category: editingGoal.category,
        priority: editingGoal.priority,
        isActive: editingGoal.isActive,
        notes: editingGoal.notes || ''
      });
    }
  }, [editingGoal]);

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Goal name is required';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Goal name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          newErrors.name = 'Goal name must be less than 100 characters';
        } else {
          delete newErrors.name;
        }
        break;
      
      case 'targetAmount':
        if (!value) {
          newErrors.targetAmount = 'Target amount is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          newErrors.targetAmount = 'Target amount must be a positive number';
        } else if (parseFloat(value) > 9999999.99) {
          newErrors.targetAmount = 'Target amount must be less than 10,000,000';
        } else {
          delete newErrors.targetAmount;
        }
        break;
      
      case 'currentAmount':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          newErrors.currentAmount = 'Current amount must be a positive number';
        } else if (value && parseFloat(value) > 9999999.99) {
          newErrors.currentAmount = 'Current amount must be less than 10,000,000';
        } else {
          delete newErrors.currentAmount;
        }
        break;
      
      case 'targetDate':
        if (!value) {
          newErrors.targetDate = 'Target date is required';
        } else if (new Date(value) <= new Date()) {
          newErrors.targetDate = 'Target date must be in the future';
        } else {
          delete newErrors.targetDate;
        }
        break;
      
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form can be submitted
  const canSubmit = () => {
    const hasRequiredFields = 
      formData.name.trim() !== '' &&
      formData.targetAmount.trim() !== '' &&
      formData.targetDate !== '';
    
    const hasNoErrors = Object.keys(errors).length === 0;
    
    return hasRequiredFields && hasNoErrors && !isSubmitting;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      // Mark all fields as touched to show errors
      const allTouched = {};
      ['name', 'targetAmount', 'currentAmount', 'targetDate'].forEach(field => 
        allTouched[field] = true
      );
      setTouched(allTouched);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingGoal) {
        const updateData = {
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          id: editingGoal.id
        };
        await onUpdate(updateData);
      } else {
        const newGoalData = {
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0
        };
        await onAdd(newGoalData);
      }

      handleCancel();
    } catch (error) {
      console.error('Error submitting goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      category: 'savings',
      priority: 'medium',
      isActive: true,
      notes: ''
    });
    setErrors({});
    setTouched({});
    setEditingGoal(null);
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

  const handleAddGoal = () => {
    setShowForm(true);
    scrollToForm();
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
    scrollToForm();
  };

  const handleDelete = (goal) => {
    onDelete(goal.id);
  };

  // Check for goals that need monthly reminders
  const checkMonthlyReminders = () => {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const goalsNeedingReminders = goals.filter(goal => {
      const stats = getGoalStats(goal);
      if (stats.isCompleted) return false;
      
      // Check if no contribution in the last month
      const lastContributionDate = goal.lastContribution ? new Date(goal.lastContribution) : new Date(goal.createdDate || '2024-01-01');
      const daysSinceLastContribution = Math.ceil((today - lastContributionDate) / (1000 * 60 * 60 * 24));
      
      // Show reminder if:
      // 1. No contribution in 30+ days, OR
      // 2. Goal is behind schedule and needs attention
      return daysSinceLastContribution >= 30 || stats.status === 'behind' || stats.status === 'urgent';
    });

    return goalsNeedingReminders;
  };

  // Test function to simulate monthly reminder check
  const testMonthlyReminders = () => {
    const reminders = checkMonthlyReminders();
    setReminderGoals(reminders);
    setShowReminders(true);
  };

  const handleCompleteGoal = (goal) => {
    const updatedGoal = {
      ...goal,
      isManuallyCompleted: true,
      completedDate: new Date().toISOString().split('T')[0]
    };
    onUpdate(updatedGoal);
  };

  const handleAddContribution = (goal) => {
    setContributingGoal(goal);
    setContributionAmount('');
    setShowContributionModal(true);
  };

  const handleContributionSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(contributionAmount);
    if (amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid contribution amount');
      return;
    }

    // Update goal progress
    const updatedGoal = {
      ...contributingGoal,
      currentAmount: contributingGoal.currentAmount + amount,
      lastContribution: new Date().toISOString().split('T')[0],
      contributionHistory: [
        ...(contributingGoal.contributionHistory || []),
        {
          amount,
          date: new Date().toISOString().split('T')[0],
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }
      ]
    };
    
    // Find Savings category ID
    const savingsCategory = categories.find(cat => cat.name === 'Savings');
    const savingsCategoryId = savingsCategory ? savingsCategory.id : '1'; // fallback to first category
    
    // Create transaction entry
    const transaction = {
      amount: amount,
      description: `Contribution to ${contributingGoal.name}`,
      categoryId: savingsCategoryId,
      subcategory: `Goal: ${contributingGoal.name}`,
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      isGoalContribution: true,
      goalId: contributingGoal.id
    };

    // Update both goal and add transaction
    onUpdate(updatedGoal);
    onAddTransaction(transaction);

    // Close modal
    setShowContributionModal(false);
    setContributingGoal(null);
    setContributionAmount('');
  };

  // Calculate goal progress and statistics
  const getGoalStats = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;
    const isCompleted = progress >= 100 || goal.isManuallyCompleted;
    
    // Calculate required monthly savings
    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
    const requiredMonthlySavings = remaining / monthsRemaining;
    
    // Determine status
    let status = 'on-track';
    if (isCompleted) {
      status = 'completed';
    } else if (isOverdue) {
      status = 'overdue';
    } else if (daysRemaining <= 30) {
      status = 'urgent';
    } else if (progress < 25 && daysRemaining <= 90) {
      status = 'behind';
    }

    return {
      progress: Math.min(progress, 100),
      remaining,
      daysRemaining,
      monthsRemaining,
      requiredMonthlySavings: Math.max(0, requiredMonthlySavings),
      isOverdue,
      isCompleted,
      isTargetReached: progress >= 100,
      canBeCompleted: progress >= 100 && !goal.isManuallyCompleted,
      status
    };
  };

  // Get priority icon and color
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high':
        return { icon: Zap, color: '#ef4444', label: 'High Priority' };
      case 'medium':
        return { icon: Target, color: '#f59e0b', label: 'Medium Priority' };
      case 'low':
        return { icon: Clock, color: '#6b7280', label: 'Low Priority' };
      default:
        return { icon: Target, color: '#6b7280', label: 'Medium Priority' };
    }
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: '#10b981', label: 'Completed' };
      case 'overdue':
        return { icon: AlertTriangle, color: '#ef4444', label: 'Overdue' };
      case 'urgent':
        return { icon: Clock, color: '#f59e0b', label: 'Urgent' };
      case 'behind':
        return { icon: TrendingDown, color: '#f97316', label: 'Behind Schedule' };
      case 'on-track':
        return { icon: TrendingUp, color: '#10b981', label: 'On Track' };
      default:
        return { icon: Target, color: '#6b7280', label: 'Active' };
    }
  };

  const categoryOptions = [
    { value: 'savings', label: '💰 General Savings' },
    { value: 'emergency', label: '🚨 Emergency Fund' },
    { value: 'vacation', label: '✈️ Vacation' },
    { value: 'house', label: '🏠 House/Property' },
    { value: 'car', label: '🚗 Vehicle' },
    { value: 'education', label: '🎓 Education' },
    { value: 'retirement', label: '👴 Retirement' },
    { value: 'investment', label: '📈 Investment' },
    { value: 'debt', label: '💳 Debt Payoff' },
    { value: 'other', label: '🎯 Other' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  // Filter and sort goals
  const filteredGoals = goals.filter(goal => {
    const stats = getGoalStats(goal);
    return showActiveOnly ? !stats.isCompleted : stats.isCompleted;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const statusOrder = { overdue: 5, urgent: 4, behind: 3, 'on-track': 2, completed: 1 };
    
    const aStats = getGoalStats(a);
    const bStats = getGoalStats(b);
    
    // First by status
    const statusDiff = statusOrder[bStats.status] - statusOrder[aStats.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by progress (lower progress first for incomplete goals)
    if (!aStats.isCompleted && !bStats.isCompleted) {
      return aStats.progress - bStats.progress;
    }
    
    return 0;
  });

  const displayedGoals = sortedGoals.slice(0, displayedGoalsCount);
  const hasMoreGoals = sortedGoals.length > displayedGoalsCount;

  return (
    <div className="goal-tracking">
      <div className="page-header">
        <h2>Goal Tracking</h2>
        <button 
          onClick={handleAddGoal} 
          className="add-button"
          disabled={showForm}
        >
          <Plus size={20} />
          Add Savings Goal
        </button>
      </div>

      {/* Goal Filter Toggle - Separate section */}
      {goals.length > 0 && (
        <div className="goals-filter-section">
          <div className="filter-toggle-group">
            <button 
              className={`filter-toggle-btn ${showActiveOnly ? 'active' : ''}`}
              onClick={() => {
                setShowActiveOnly(true);
                setDisplayedGoalsCount(5);
              }}
            >
              Active ({goals.filter(g => !getGoalStats(g).isCompleted).length})
            </button>
            <button 
              className={`filter-toggle-btn ${!showActiveOnly ? 'active' : ''}`}
              onClick={() => {
                setShowActiveOnly(false);
                setDisplayedGoalsCount(5);
              }}
            >
              Completed ({goals.filter(g => getGoalStats(g).isCompleted).length})
            </button>
          </div>
        </div>
      )}

      {/* Goals Summary */}
      {goals.length > 0 && (
        <div className="goals-summary-compact">
          <div className="summary-compact-grid">
            <div className="summary-metric">
              <Target size={16} className="metric-icon" />
              <span className="metric-value">{goals.length}</span>
              <span className="metric-label">Total</span>
            </div>
            
            <div className="summary-metric completed">
              <CheckCircle size={16} className="metric-icon" />
              <span className="metric-value">
                {goals.filter(g => getGoalStats(g).isCompleted).length}
              </span>
              <span className="metric-label">Done</span>
            </div>
            
            <div className="summary-metric progress">
              <TrendingUp size={16} className="metric-icon" />
              <span className="metric-value">
                {goals.filter(g => !getGoalStats(g).isCompleted && g.isActive).length}
              </span>
              <span className="metric-label">Active</span>
            </div>
            
            <div className="summary-metric amount">
              <DollarSign size={16} className="metric-icon" />
              <span className="metric-value">
                {(goals.reduce((sum, g) => sum + g.targetAmount, 0) / 1000).toFixed(0)}k
              </span>
              <span className="metric-label">Target</span>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="goal-form-container" ref={formRef}>
          <form onSubmit={handleSubmit} className="goal-form" noValidate>
            <div className="form-header">
              <h3>{editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}</h3>
              <button 
                type="button" 
                onClick={handleCancel} 
                className="icon-button"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label htmlFor="name">Goal Name *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="e.g., Emergency Fund, Vacation to Europe"
                    className={errors.name && touched.name ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength="100"
                  />
                  {errors.name && touched.name && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      <span>{errors.name}</span>
                    </div>
                  )}
                  <div className="char-count">
                    {formData.name.length}/100
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <div className="input-wrapper">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe your goal (optional)"
                    disabled={isSubmitting}
                    maxLength="500"
                  />
                  <div className="char-count">
                    {formData.description.length}/500
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetAmount">Target Amount ({currencyInfo?.symbol}) *</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      id="targetAmount"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      className={errors.targetAmount && touched.targetAmount ? 'error' : ''}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    {errors.targetAmount && touched.targetAmount && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.targetAmount}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="currentAmount">Current Amount ({currencyInfo?.symbol})</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      id="currentAmount"
                      name="currentAmount"
                      value={formData.currentAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={errors.currentAmount && touched.currentAmount ? 'error' : ''}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    {errors.currentAmount && touched.currentAmount && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.currentAmount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetDate">Target Date *</label>
                  <div className="input-wrapper">
                    <input
                      type="date"
                      id="targetDate"
                      name="targetDate"
                      value={formData.targetDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={errors.targetDate && touched.targetDate ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.targetDate && touched.targetDate && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.targetDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <div className="input-wrapper">
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes or action steps (optional)"
                    disabled={isSubmitting}
                    maxLength="500"
                  />
                  <div className="char-count">
                    {formData.notes.length}/500
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span>Active (track progress towards this goal)</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="cancel-button"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={!canSubmit()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    {editingGoal ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingGoal ? 'Update' : 'Save'} Goal
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {displayedGoals.length > 0 ? (
        <>
          <div className="goals-list">
            {displayedGoals.map(goal => {
            const stats = getGoalStats(goal);
            const priorityInfo = getPriorityInfo(goal.priority);
            const statusInfo = getStatusInfo(stats.status);
            const PriorityIcon = priorityInfo.icon;
            const StatusIcon = statusInfo.icon;
            const categoryOption = categoryOptions.find(c => c.value === goal.category);
            
            return (
              <div key={goal.id} className={`goal-item ${stats.status} ${!goal.isActive ? 'inactive' : ''}`}>
                <div className="goal-header">
                  <div className="goal-title-section">
                    <h4 className="goal-name">{goal.name}</h4>
                    <div className="goal-meta">
                      <span className="goal-category">
                        {categoryOption ? categoryOption.label : '🎯 Other'}
                      </span>
                      <span className="goal-priority" style={{ color: priorityInfo.color }}>
                        <PriorityIcon size={14} />
                        {priorityInfo.label}
                      </span>
                      <span className="goal-status" style={{ color: statusInfo.color }}>
                        <StatusIcon size={14} />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="goal-actions">
                    {!stats.isCompleted && (
                      <button
                        onClick={() => handleAddContribution(goal)}
                        className="icon-button contribute-button"
                        title="Add contribution"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                    {!stats.isCompleted && (
                      <button
                        onClick={() => handleEdit(goal)}
                        className="icon-button edit-button"
                        title="Edit goal"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(goal)}
                      className="icon-button delete-button"
                      title="Delete goal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p className="goal-description">{goal.description}</p>
                )}

                <div className="goal-progress-section">
                  <div className="progress-info">
                    <div className="amount-info">
                      <span className="current-amount">
                        {currencyInfo?.symbol} {formatLargeNumber(goal.currentAmount)}
                      </span>
                      <ArrowRight size={16} className="arrow" />
                      <span className="target-amount">
                        {currencyInfo?.symbol} {formatLargeNumber(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="progress-percentage">
                      {stats.progress.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${stats.progress}%`,
                        backgroundColor: statusInfo.color
                      }}
                    ></div>
                  </div>
                  
                  <div className="goal-stats">
                    <div className="stat-item">
                      <span className="stat-label">Remaining</span>
                      <span className="stat-value">
                        {currencyInfo?.symbol} {formatLargeNumber(stats.remaining)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Days left</span>
                      <span className={`stat-value ${stats.isOverdue ? 'overdue' : ''}`}>
                        {stats.isOverdue ? `${Math.abs(stats.daysRemaining)} days overdue` : `${stats.daysRemaining} days`}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Target date</span>
                      <span className="stat-value">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                    </div>
                    {!stats.isCompleted && stats.requiredMonthlySavings > 0 && (
                      <div className="stat-item recommended">
                        <span className="stat-label">Monthly suggestion</span>
                        <span className="stat-value highlight">
                          {currencyInfo?.symbol} {formatLargeNumber(stats.requiredMonthlySavings)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {goal.notes && (
                  <div className="goal-notes">
                    <strong>Notes:</strong> {goal.notes}
                  </div>
                )}

                {stats.canBeCompleted && (
                  <div className="goal-completion-cta">
                    <div className="completion-message">
                      <CheckCircle size={20} className="success-icon" />
                      <span>🎉 Congratulations! You've reached your goal!</span>
                    </div>
                    <button 
                      onClick={() => handleCompleteGoal(goal)}
                      className="complete-goal-button"
                    >
                      <Award size={16} />
                      Mark as Completed
                    </button>
                  </div>
                )}

                {stats.isCompleted && goal.isManuallyCompleted && (
                  <div className="completion-badge">
                    <Award size={20} />
                    <span>Goal Achieved!</span>
                    {goal.completedDate && (
                      <span className="completion-date">
                        Completed on {new Date(goal.completedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Load More Button */}
        {hasMoreGoals && (
          <div className="load-more-container">
            <button 
              onClick={() => setDisplayedGoalsCount(prev => prev + 5)}
              className="load-more-button"
            >
              Load More Goals ({sortedGoals.length - displayedGoalsCount} remaining)
            </button>
          </div>
        )}
      </>
      ) : (
        <div className="empty-state">
          <Flag size={48} />
          <h3>No Savings Goals</h3>
          <p>Create your first savings goal to start tracking your financial progress.</p>
          <button onClick={handleAddGoal} className="add-button">
            <Plus size={20} />
            Add Your First Goal
          </button>
        </div>
      )}

      {/* Contribution Modal */}
      {showContributionModal && contributingGoal && (
        <div className="modal-overlay">
          <div className="contribution-modal">
            <div className="modal-header">
              <h3>Add Contribution</h3>
              <button 
                onClick={() => setShowContributionModal(false)}
                className="icon-button"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleContributionSubmit} className="contribution-form">
              <div className="goal-info">
                <h4>{contributingGoal.name}</h4>
                <div className="current-progress">
                  <span>Current: {currencyInfo?.symbol} {formatLargeNumber(contributingGoal.currentAmount)}</span>
                  <span>Target: {currencyInfo?.symbol} {formatLargeNumber(contributingGoal.targetAmount)}</span>
                </div>
                <div className="remaining-amount">
                  Remaining: {currencyInfo?.symbol} {formatLargeNumber(contributingGoal.targetAmount - contributingGoal.currentAmount)}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contribution-amount">Contribution Amount</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">{currencyInfo?.symbol}</span>
                  <input
                    id="contribution-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="quick-amounts">
                <span className="quick-label">Quick amounts:</span>
                {getGoalStats(contributingGoal).requiredMonthlySavings > 0 && (
                  <button
                    type="button"
                    onClick={() => setContributionAmount(getGoalStats(contributingGoal).requiredMonthlySavings.toFixed(2))}
                    className="quick-amount-btn"
                  >
                    Suggested: {currencyInfo?.symbol} {formatLargeNumber(getGoalStats(contributingGoal).requiredMonthlySavings)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setContributionAmount('50')}
                  className="quick-amount-btn"
                >
                  {currencyInfo?.symbol}50
                </button>
                <button
                  type="button"
                  onClick={() => setContributionAmount('100')}
                  className="quick-amount-btn"
                >
                  {currencyInfo?.symbol}100
                </button>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowContributionModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="add-button"
                  disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
                >
                  <Plus size={16} />
                  Add Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Monthly Reminders Modal */}
      <Modal
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        title="Monthly Goal Reminders"
        type="info"
      >
        <div className="reminders-modal-content">
          {reminderGoals.length > 0 ? (
            <>
              <p className="reminder-intro">The following goals need your attention:</p>
              <div className="reminder-goals-list">
                {reminderGoals.map(goal => {
                  const stats = getGoalStats(goal);
                  const lastContributionDate = goal.lastContribution ? new Date(goal.lastContribution) : new Date(goal.createdDate || '2024-01-01');
                  const daysSinceLastContribution = Math.ceil((new Date() - lastContributionDate) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={goal.id} className="reminder-goal-item">
                      <div className="goal-info">
                        <h4 className="goal-name">{goal.name}</h4>
                        <div className="goal-details">
                          <p className="goal-status">
                            Status: <span className={`status-badge ${stats.status}`}>{stats.status.replace('-', ' ')}</span>
                          </p>
                          <p className="last-contribution">
                            Last contribution: <strong>{daysSinceLastContribution} days ago</strong>
                          </p>
                          {stats.requiredMonthlySavings > 0 && (
                            <p className="monthly-suggestion">
                              Monthly suggestion: <strong>{currencyInfo?.symbol} {formatLargeNumber(stats.requiredMonthlySavings)}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setContributingGoal(goal);
                          setShowReminders(false);
                          setShowContributionModal(true);
                        }}
                        className="contribute-btn"
                      >
                        <Plus size={16} />
                        Add Contribution
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="no-reminders">
              <Target size={48} className="no-reminders-icon" />
              <h4 className="no-reminders-title">All Goals Up to Date!</h4>
              <p className="no-reminders-text">Great job! All your active goals have recent contributions or are on track.</p>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}

export default GoalTracking;