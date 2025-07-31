import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { currencies } from '../utils/currencies';

function TransactionForm({ transaction, categories, currency, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        categoryId: transaction.categoryId,
        date: transaction.date,
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

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
      
      case 'date':
        if (!value) {
          newErrors.date = 'Date is required';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(today.getFullYear() + 1);
          
          if (selectedDate < oneYearAgo) {
            newErrors.date = 'Date cannot be more than 1 year ago';
          } else if (selectedDate > oneYearFromNow) {
            newErrors.date = 'Date cannot be more than 1 year in the future';
          } else {
            delete newErrors.date;
          }
        }
        break;
      
      case 'notes':
        if (value && value.length > 500) {
          newErrors.notes = 'Notes must be less than 500 characters';
        } else {
          delete newErrors.notes;
        }
        break;
      
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const fields = ['amount', 'description', 'categoryId', 'date', 'notes'];
    let isValid = true;
    
    fields.forEach(field => {
      const fieldIsValid = validateField(field, formData[field]);
      if (!fieldIsValid) isValid = false;
    });
    
    // Mark all fields as touched to show errors
    const allTouched = {};
    fields.forEach(field => allTouched[field] = true);
    setTouched(allTouched);
    
    return isValid;
  };

  // Check if form can be submitted (required fields filled + no errors)
  const canSubmit = () => {
    const hasRequiredFields = 
      formData.amount.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.categoryId !== '' &&
      formData.date !== '';
    
    const hasNoErrors = Object.keys(errors).length === 0;
    
    return hasRequiredFields && hasNoErrors && !isSubmitting;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        id: transaction?.id
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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

  const handleKeyDown = (e) => {
    // Submit form with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    // Cancel with Escape
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);
  const currencyInfo = currencies.find(c => c.code === currency);

  return (
    <div className="transaction-form" onKeyDown={handleKeyDown}>
      <div className="form-header">
        <h3>{transaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
        <button onClick={onCancel} className="icon-button" disabled={isSubmitting}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
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
          <label htmlFor="date">Date *</label>
          <div className="input-wrapper">
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={errors.date && touched.date ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.date && touched.date && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{errors.date}</span>
              </div>
            )}
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
              onBlur={handleBlur}
              rows="3"
              placeholder="Additional notes (optional)"
              className={errors.notes && touched.notes ? 'error' : ''}
              disabled={isSubmitting}
              maxLength="500"
            />
            {errors.notes && touched.notes && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{errors.notes}</span>
              </div>
            )}
            <div className="char-count">
              {formData.notes.length}/500
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
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
                {transaction ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {transaction ? 'Update' : 'Save'} Transaction
              </>
            )}
          </button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="keyboard-hints">
          <small>
            Press <kbd>Ctrl+Enter</kbd> to save • <kbd>Esc</kbd> to cancel
          </small>
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;