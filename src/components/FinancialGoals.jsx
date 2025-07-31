import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Target, 
  Calendar, 
  AlertCircle, 
  Loader2, 
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Flag,
  Play,
  Pause
} from 'lucide-react';
import { currencies } from '../utils/currencies';

function FinancialGoals({ goals, transactions, currency, onAdd, onUpdate, onDelete, onToggleActive }) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'savings',
    description: '',
    isActive: true,
    autoTrack: false,
    trackingCategories: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const currencyInfo = currencies.find(c => c.code === currency);

  const goalCategories = [
    { value: 'savings', label: 'Emergency Fund', icon: '🛡️' },
    { value: 'vacation', label: 'Vacation', icon: '🏖️' },
    { value: 'house', label: 'House Down Payment', icon: '🏠' },
    { value: 'car', label: 'Car Purchase', icon: '🚗' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'retirement', label: 'Retirement', icon: '🏖️' },
    { value: 'debt', label: 'Debt Payoff', icon: '💳' },
    { value: 'investment', label: 'Investment', icon: '📈' },
    { value: 'other', label: 'Other', icon: '🎯' }
  ];

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount.toString(),
        currentAmount: editingGoal.currentAmount.toString(),
        targetDate: editingGoal.targetDate,
        category: editingGoal.category,
        description: editingGoal.description || '',
        isActive: editingGoal.isActive,
        autoTrack: editingGoal.autoTrack || false,
        trackingCategories: editingGoal.trackingCategories || []
      });
    }
  }, [editingGoal]);

  // Calculate goal progress and statistics
  const goalStats = useMemo(() => {
    return goals.map(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      
      // Calculate days to target
      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      
      // Calculate required daily savings
      const dailySavingsNeeded = daysRemaining > 0 ? remaining / daysRemaining : 0;
      
      // Calculate progress trend (if auto-tracking)
      let trend = 'stable';
      if (goal.autoTrack) {
        // This would be enhanced with historical data
        trend = progress > 50 ? 'good' : progress > 25 ? 'moderate' : 'slow';
      }

      // Determine status
      let status = 'active';
      if (progress >= 100) {
        status = 'completed';
      } else if (daysRemaining < 0) {
        status = 'overdue';
      } else if (daysRemaining <= 30) {
        status = 'urgent';
      }

      return {
        ...goal,
        progress: Math.min(progress, 100),
        remaining,
        daysRemaining,
        dailySavingsNeeded,
        trend,
        status
      };
    });
  }, [goals]);

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Goal name is required';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Goal name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          newErrors.name = 'Goal name must be less than 50 characters';
        } else {
          delete newErrors.name;
        }
        break;
      
      case 'targetAmount':
        if (!value) {
          newErrors.targetAmount = 'Target amount is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          newErrors.targetAmount = 'Target amount must be a positive number';
        } else if (parseFloat(value) > 10000000) {
          newErrors.targetAmount = 'Target amount must be less than 10,000,000';
        } else {
          delete newErrors.targetAmount;
        }
        break;
      
      case 'currentAmount':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          newErrors.currentAmount = 'Current amount must be a non-negative number';
        } else if (value && parseFloat(value) > parseFloat(formData.targetAmount || 0)) {
          newErrors.currentAmount = 'Current amount cannot exceed target amount';
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
      const allTouched = {};
      ['name', 'targetAmount', 'currentAmount', 'targetDate'].forEach(field => 
        allTouched[field] = true
      );
      setTouched(allTouched);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount || 0),
        id: editingGoal ? editingGoal.id : Date.now().toString(),
        createdAt: editingGoal ? editingGoal.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingGoal) {
        await onUpdate(submitData);
      } else {
        await onAdd(submitData);
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
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      category: 'savings',
      description: '',
      isActive: true,
      autoTrack: false,
      trackingCategories: []
    });
    setErrors({});
    setTouched({});
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = (goal) => {
    if (window.confirm(`Are you sure you want to delete the goal "${goal.name}"?`)) {
      onDelete(goal.id);
    }
  };

  const handleToggleActive = (goal) => {
    onToggleActive(goal.id, !goal.isActive);
  };

  const formatCurrency = (amount) => {
    return `${currencyInfo?.symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success-color)';
      case 'urgent': return 'var(--warning-color)';
      case 'overdue': return 'var(--danger-color)';
      default: return 'var(--primary-color)';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'urgent': return 'Urgent';
      case 'overdue': return 'Overdue';
      default: return 'Active';
    }
  };

  return (
    <div className="financial-goals">
      <div className="goals-header">
        <div className="header-left">
          <h2>Financial Goals</h2>
          <p className="header-subtitle">
            Set and track your financial goals to stay motivated
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="add-button"
          disabled={showForm}
        >
          <Plus size={20} />
          Add Financial Goal
        </button>
      </div>

      {showForm && (
        <div className="goal-form-container">
          <form onSubmit={handleSubmit} className="goal-form" noValidate>
            <div className="form-header">
              <h3>{editingGoal ? 'Edit Goal' : 'Add Financial Goal'}</h3>
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
                    placeholder="e.g., Emergency Fund, Vacation, New Car"
                    className={errors.name && touched.name ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength="50"
                  />
                  {errors.name && touched.name && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      <span>{errors.name}</span>
                    </div>
                  )}
                  <div className="char-count">
                    {formData.name.length}/50
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
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {goalCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                    placeholder="Why is this goal important to you?"
                    disabled={isSubmitting}
                    maxLength="200"
                  />
                  <div className="char-count">
                    {formData.description.length}/200
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

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="autoTrack"
                    checked={formData.autoTrack}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span>Auto-track from transactions (coming soon)</span>
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
      {goalStats.length > 0 ? (
        <div className="goals-list">
          {goalStats.map(goal => {
            const category = goalCategories.find(c => c.value === goal.category);
            
            return (
              <div key={goal.id} className={`goal-item ${!goal.isActive ? 'inactive' : ''}`}>
                <div className="goal-header">
                  <div className="goal-info">
                    <div className="goal-title">
                      <span className="goal-icon">{category?.icon || '🎯'}</span>
                      <h4>{goal.name}</h4>
                      <span className={`goal-status ${goal.status}`}>
                        {getStatusLabel(goal.status)}
                      </span>
                    </div>
                    <div className="goal-amounts">
                      <span className="current-amount">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="target-amount">
                        of {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="goal-actions">
                    <button
                      onClick={() => handleToggleActive(goal)}
                      className={`toggle-button ${goal.isActive ? 'active' : 'inactive'}`}
                      title={goal.isActive ? 'Pause goal' : 'Resume goal'}
                    >
                      {goal.isActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => handleEdit(goal)}
                      className="icon-button edit-button"
                      title="Edit goal"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal)}
                      className="icon-button delete-button"
                      title="Delete goal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${goal.progress}%`,
                        backgroundColor: getStatusColor(goal.status)
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {goal.progress.toFixed(1)}% complete
                  </span>
                </div>

                <div className="goal-details">
                  <div className="goal-stats">
                    <div className="stat-item">
                      <DollarSign size={14} />
                      <span className="stat-label">Remaining:</span>
                      <span className="stat-value">{formatCurrency(goal.remaining)}</span>
                    </div>
                    <div className="stat-item">
                      <Calendar size={14} />
                      <span className="stat-label">Target Date:</span>
                      <span className="stat-value">{formatDate(goal.targetDate)}</span>
                    </div>
                    <div className="stat-item">
                      <Clock size={14} />
                      <span className="stat-label">Days Left:</span>
                      <span className={`stat-value ${goal.daysRemaining < 30 ? 'urgent' : ''}`}>
                        {goal.daysRemaining > 0 ? goal.daysRemaining : 'Overdue'}
                      </span>
                    </div>
                    {goal.dailySavingsNeeded > 0 && (
                      <div className="stat-item">
                        <TrendingUp size={14} />
                        <span className="stat-label">Daily Target:</span>
                        <span className="stat-value">{formatCurrency(goal.dailySavingsNeeded)}</span>
                      </div>
                    )}
                  </div>
                  
                  {goal.description && (
                    <p className="goal-description">{goal.description}</p>
                  )}
                </div>

                {goal.status === 'completed' && (
                  <div className="goal-completion">
                    <CheckCircle size={20} />
                    <span>Congratulations! You've reached your goal!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Target size={48} />
          <h3>No Financial Goals</h3>
          <p>Set your first financial goal to start building a better future.</p>
          <button onClick={() => setShowForm(true)} className="add-button">
            <Plus size={20} />
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}

export default FinancialGoals;