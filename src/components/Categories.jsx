import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

function Categories({ categories, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    type: 'expense'
  });

  const predefinedColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'
  ];

  // Check if form can be submitted (required fields filled)
  const canSubmit = () => {
    return formData.name.trim() !== '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    if (editingCategory) {
      onUpdate({ ...editingCategory, ...formData });
      setEditingCategory(null);
    } else {
      onAdd(formData);
    }

    setFormData({ name: '', color: '#3b82f6', type: 'expense' });
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

  const handleAddCategory = () => {
    setShowForm(true);
    scrollToForm();
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      type: category.type
    });
    setShowForm(true);
    scrollToForm();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#3b82f6', type: 'expense' });
  };

  const handleDelete = (category) => {
    onDelete(category.id);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="categories-page">
      <div className="page-header">
        <h2>Categories</h2>
        <button
          onClick={handleAddCategory}
          className="add-button"
          disabled={showForm}
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="category-form-container" ref={formRef}>
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button type="button" onClick={handleCancel} className="icon-button">
                <X size={20} />
              </button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    />
                    <span> Expense</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    />
                    <span> Income</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="color-input"
                />
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
                  {editingCategory ? 'Update' : 'Save'} Category
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="categories-grid">
        {/* Expense Categories */}
        <div className="category-section">
          <h3>Expense Categories ({expenseCategories.length})</h3>
          <div className="category-list">
            {expenseCategories.map(category => (
              <div key={category.id} className="category-item">
                <div className="category-info">
                  <div 
                    className="category-color"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="category-name">{category.name}</span>
                </div>
                <div className="category-actions">
                  <button
                    onClick={() => handleEdit(category)}
                    className="icon-button edit-button"
                    title="Edit category"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="icon-button delete-button"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {expenseCategories.length === 0 && (
              <div className="empty-state">
                <p>No expense categories yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Income Categories */}
        <div className="category-section">
          <h3>Income Categories ({incomeCategories.length})</h3>
          <div className="category-list">
            {incomeCategories.map(category => (
              <div key={category.id} className="category-item">
                <div className="category-info">
                  <div 
                    className="category-color"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="category-name">{category.name}</span>
                </div>
                <div className="category-actions">
                  <button
                    onClick={() => handleEdit(category)}
                    className="icon-button edit-button"
                    title="Edit category"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="icon-button delete-button"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {incomeCategories.length === 0 && (
              <div className="empty-state">
                <p>No income categories yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Categories;