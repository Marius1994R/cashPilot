import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Repeat, Calendar, AlertCircle, Loader2, Play, Pause } from 'lucide-react';
import { currencies } from '../utils/currencies';
import { getNextOccurrence } from '../utils/recurringTransactionGenerator';

function RecurringTransactions({ 
  recurringTransactions, 
  categories, 
  currency, 
  onAdd, 
  onUpdate, 
  onDelete,
  onToggleActive 
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
  const [displayedCount, setDisplayedCount] = useState(8);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    categoryId: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    dayOfMonth: new Date().getDate(),
    dayOfWeek: new Date().getDay(),
    isActive: true,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const currencyInfo = currencies.find(c => c.code === currency);

  useEffect(() => {
    if (editingRecurring) {
      setFormData({
        type: editingRecurring.type,
        amount: editingRecurring.amount.toString(),
        description: editingRecurring.description,
        categoryId: editingRecurring.categoryId,
        frequency: editingRecurring.frequency,
        startDate: editingRecurring.startDate,
        endDate: editingRecurring.endDate || '',
        dayOfMonth: editingRecurring.dayOfMonth || new Date().getDate(),
        dayOfWeek: editingRecurring.dayOfWeek || new Date().getDay(),
        isActive: editingRecurring.isActive,
        notes: editingRecurring.notes || ''
      });
    }
  }, [editingRecurring]);

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'amount':
        if (!value) {
          newErrors.amount = 'Amount is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          newErrors.amount = 'Amount must be a positive number';
        } else if (parseFloat(value) > 999999.99) {
          newErrors.amount = 'Amount must be less than 1,000,000';
        } else {
          delete newErrors.amount;
        }
        break;
      
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 2) {
          newErrors.description = 'Description must be at least 2 characters';
        } else if (value.trim().length > 100) {
          newErrors.description = 'Description must be less than 100 characters';
        } else {
          delete newErrors.description;
        }
        break;
      
      case 'categoryId':
        if (!value) {
          newErrors.categoryId = 'Category is required';
        } else {
          delete newErrors.categoryId;
        }
        break;
      
      case 'startDate':
        if (!value) {
          newErrors.startDate = 'Start date is required';
        } else {
          delete newErrors.startDate;
        }
        break;
      
      case 'endDate':
        if (value && new Date(value) <= new Date(formData.startDate)) {
          newErrors.endDate = 'End date must be after start date';
        } else {
          delete newErrors.endDate;
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
      formData.amount.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.categoryId !== '' &&
      formData.startDate !== '';
    
    const hasNoErrors = Object.keys(errors).length === 0;
    
    return hasRequiredFields && hasNoErrors && !isSubmitting;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      // Mark all fields as touched to show errors
      const allTouched = {};
      ['amount', 'description', 'categoryId', 'startDate', 'endDate'].forEach(field => 
        allTouched[field] = true
      );
      setTouched(allTouched);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        id: editingRecurring ? editingRecurring.id : Date.now().toString()
      };

      if (editingRecurring) {
        await onUpdate(submitData);
      } else {
        await onAdd(submitData);
      }

      handleCancel();
    } catch (error) {
      console.error('Error submitting recurring transaction:', error);
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
      type: 'expense',
      amount: '',
      description: '',
      categoryId: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      dayOfMonth: new Date().getDate(),
      dayOfWeek: new Date().getDay(),
      isActive: true,
      notes: ''
    });
    setErrors({});
    setTouched({});
    setEditingRecurring(null);
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

  const handleAddRecurring = () => {
    setShowForm(true);
    scrollToForm();
  };

  const handleEdit = (recurring) => {
    setEditingRecurring(recurring);
    setShowForm(true);
    scrollToForm();
  };

  const handleDelete = (recurring) => {
    onDelete(recurring.id);
  };

  const handleToggleActive = (recurring) => {
    onToggleActive(recurring.id, !recurring.isActive);
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const weekDays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Filter recurring transactions based on selected type
  const filteredRecurringTransactions = recurringTransactions.filter(recurring => {
    if (filterType === 'all') return true;
    return recurring.type === filterType;
  });

  // Get displayed transactions with load more logic
  const displayedTransactions = filteredRecurringTransactions.slice(0, displayedCount);
  const hasMoreToShow = filteredRecurringTransactions.length > displayedCount;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 8);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setDisplayedCount(8); // Reset to initial count when changing filter
  };



  return (
    <div className="recurring-transactions">
      <div className="page-header">
        <h2>Recurring Transactions</h2>
        <button 
          onClick={handleAddRecurring} 
          className="add-button"
          disabled={showForm}
        >
          <Plus size={20} />
          Add Recurring Transaction
        </button>
      </div>

      {/* Filter Toggle - Only show if there are transactions */}
      {recurringTransactions.length > 0 && (
        <div className="recurring-filter-section">
          <div className="filter-toggle-group">
            <button 
              className={`filter-toggle-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All ({recurringTransactions.length})
            </button>
            <button 
              className={`filter-toggle-btn ${filterType === 'expense' ? 'active' : ''}`}
              onClick={() => handleFilterChange('expense')}
            >
              Expenses ({recurringTransactions.filter(t => t.type === 'expense').length})
            </button>
            <button 
              className={`filter-toggle-btn ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => handleFilterChange('income')}
            >
              Income ({recurringTransactions.filter(t => t.type === 'income').length})
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="recurring-form-container" ref={formRef}>
          <form onSubmit={handleSubmit} className="recurring-form" noValidate>
            <div className="form-header">
              <h3>{editingRecurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</h3>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <span> Expense</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <span> Income</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount ({currencyInfo?.symbol}) *</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      className={errors.amount && touched.amount ? 'error' : ''}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    {errors.amount && touched.amount && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="Enter description"
                    className={errors.description && touched.description ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength="100"
                  />
                  {errors.description && touched.description && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      <span>{errors.description}</span>
                    </div>
                  )}
                  <div className="char-count">
                    {formData.description.length}/100
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="categoryId">Category *</label>
                  <div className="input-wrapper">
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={errors.categoryId && touched.categoryId ? 'error' : ''}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a category</option>
                      {filteredCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && touched.categoryId && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.categoryId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="frequency">Frequency *</label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency-specific options */}
              {formData.frequency === 'weekly' && (
                <div className="form-group">
                  <label htmlFor="dayOfWeek">Day of Week</label>
                  <select
                    id="dayOfWeek"
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {weekDays.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div className="form-group">
                  <label htmlFor="dayOfMonth">Day of Month</label>
                  <input
                    type="number"
                    id="dayOfMonth"
                    name="dayOfMonth"
                    value={formData.dayOfMonth}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    disabled={isSubmitting}
                  />
                  <small>If day doesn't exist in a month, it will use the last day of that month</small>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <div className="input-wrapper">
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={errors.startDate && touched.startDate ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.startDate && touched.startDate && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.startDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date (Optional)</label>
                  <div className="input-wrapper">
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.endDate && touched.endDate ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.endDate && touched.endDate && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{errors.endDate}</span>
                      </div>
                    )}
                  </div>
                </div>
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
                    placeholder="Additional notes (optional)"
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
                  <span>Active (generate transactions automatically)</span>
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
                    {editingRecurring ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingRecurring ? 'Update' : 'Save'} Recurring Transaction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring Transactions List */}
      {recurringTransactions.length > 0 ? (
        <>
          {filteredRecurringTransactions.length > 0 ? (
            <>
              <div className="recurring-list">
                {displayedTransactions.map(recurring => {
                  const category = categories.find(c => c.id === recurring.categoryId);
                  const nextOccurrence = getNextOccurrence(recurring);
                  
                  return (
                    <div key={recurring.id} className={`recurring-item ${!recurring.isActive ? 'inactive' : ''}`}>
                      <div className="recurring-info">
                        <div className="recurring-main">
                          <div className="recurring-description">
                            <h4>{recurring.description}</h4>
                            <div className="recurring-details">
                              <span className="frequency">
                                <Repeat size={14} />
                                {recurring.frequency.charAt(0).toUpperCase() + recurring.frequency.slice(1)}
                              </span>
                              <span className="next-occurrence">
                                <Calendar size={14} />
                                Next: {nextOccurrence || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="recurring-amount">
                            <span className={`amount ${recurring.type}`}>
                              {recurring.type === 'expense' ? '-' : '+'}{currencyInfo?.symbol} {recurring.amount.toFixed(2)}
                            </span>
                            {category && (
                              <span className="category" style={{ color: category.color }}>
                                {category.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {recurring.notes && (
                          <p className="recurring-notes">{recurring.notes}</p>
                        )}
                      </div>
                      
                      <div className="recurring-actions">
                        <button
                          onClick={() => handleToggleActive(recurring)}
                          className={`toggle-button ${recurring.isActive ? 'active' : 'inactive'}`}
                          title={recurring.isActive ? 'Pause recurring transaction' : 'Resume recurring transaction'}
                        >
                          {recurring.isActive ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => handleEdit(recurring)}
                          className="icon-button edit-button"
                          title="Edit recurring transaction"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(recurring)}
                          className="icon-button delete-button"
                          title="Delete recurring transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMoreToShow && (
                <div className="load-more-section">
                  <button onClick={handleLoadMore} className="load-more-button">
                    Load More ({filteredRecurringTransactions.length - displayedCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Repeat size={48} />
              <h3>No {filterType === 'all' ? '' : filterType} recurring transactions</h3>
              <p>
                {filterType === 'expense' 
                  ? 'No recurring expenses found. Add recurring payments like rent or subscriptions.'
                  : filterType === 'income'
                  ? 'No recurring income found. Add recurring income like salary or freelance payments.'
                  : 'No recurring transactions match the current filter.'}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Repeat size={48} />
          <h3>No Recurring Transactions</h3>
          <p>Set up automatic transactions like salary, rent, or subscriptions to save time.</p>
          <button onClick={handleAddRecurring} className="add-button">
            <Plus size={20} />
            Add Your First Recurring Transaction
          </button>
        </div>
      )}
    </div>
  );
}

export default RecurringTransactions;