import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { transactionService, categoryService } from '../../services/firebaseService';

const DebugPanel = () => {
  const { currentUser } = useAuth();
  const { 
    transactions, 
    categories, 
    budgets, 
    goals, 
    settings, 
    loading, 
    error,
    addTransaction,
    addCategory 
  } = useData();
  
  const [debugInfo, setDebugInfo] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const logInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${message}`);
    console.log(`[DEBUG] ${message}`);
  };

  const testFirebaseConnection = async () => {
    logInfo('=== TESTING FIREBASE CONNECTION ===');
    
    try {
      if (!currentUser) {
        logInfo('❌ No authenticated user');
        return;
      }
      
      logInfo(`✅ User authenticated: ${currentUser.email} (${currentUser.uid})`);
      
      // Test direct Firebase service
      logInfo('Testing direct transactionService.getAll...');
      const directTransactions = await transactionService.getAll(currentUser.uid);
      logInfo(`✅ Direct Firebase call successful. Transactions: ${directTransactions.length}`);
      
      // Test adding a transaction
      logInfo('Testing direct transactionService.create...');
      const testTransaction = {
        type: 'expense',
        amount: 1,
        description: 'Debug Test Transaction',
        categoryId: categories[0]?.id || 'test-category',
        date: new Date().toISOString().split('T')[0],
        notes: 'This is a debug test'
      };
      
      const newTransaction = await transactionService.create(testTransaction, currentUser.uid);
      logInfo(`✅ Direct transaction creation successful. ID: ${newTransaction.id}`);
      
      // Test context addTransaction
      logInfo('Testing context addTransaction...');
      const contextTransaction = {
        type: 'income',
        amount: 2,
        description: 'Context Test Transaction',
        categoryId: categories[0]?.id || 'test-category',
        date: new Date().toISOString().split('T')[0],
        notes: 'This is a context test'
      };
      
      await addTransaction(contextTransaction);
      logInfo('✅ Context addTransaction successful');
      
    } catch (error) {
      logInfo(`❌ Error: ${error.message}`);
      logInfo(`❌ Error details: ${JSON.stringify(error, null, 2)}`);
    }
  };

  const testCategoryCreation = async () => {
    logInfo('=== TESTING CATEGORY CREATION ===');
    
    try {
      const testCategory = {
        name: 'Debug Category',
        color: '#ff0000',
        type: 'expense'
      };
      
      logInfo('Testing direct categoryService.create...');
      const directCategory = await categoryService.create(testCategory, currentUser.uid);
      logInfo(`✅ Direct category creation successful. ID: ${directCategory.id}`);
      
      logInfo('Testing context addCategory...');
      const contextCategory = {
        name: 'Context Category',
        color: '#00ff00',
        type: 'income'
      };
      
      await addCategory(contextCategory);
      logInfo('✅ Context addCategory successful');
      
    } catch (error) {
      logInfo(`❌ Category Error: ${error.message}`);
    }
  };

  const logCurrentState = () => {
    logInfo('=== CURRENT STATE ===');
    logInfo(`User: ${currentUser?.email || 'Not authenticated'}`);
    logInfo(`Loading: ${loading}`);
    logInfo(`Error: ${error || 'None'}`);
    logInfo(`Transactions: ${transactions.length}`);
    logInfo(`Categories: ${categories.length}`);
    logInfo(`Budgets: ${budgets.length}`);
    logInfo(`Goals: ${goals.length}`);
    logInfo(`Settings: ${JSON.stringify(settings)}`);
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🐛
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      height: '500px',
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => setIsVisible(false)} style={{ float: 'right' }}>❌</button>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <button onClick={logCurrentState} style={{ marginRight: '8px' }}>
          Log State
        </button>
        <button onClick={testFirebaseConnection} style={{ marginRight: '8px' }}>
          Test Firebase
        </button>
        <button onClick={testCategoryCreation} style={{ marginRight: '8px' }}>
          Test Categories
        </button>
        <button onClick={() => setDebugInfo('')}>
          Clear
        </button>
      </div>
      
      <textarea
        value={debugInfo}
        readOnly
        style={{
          width: '100%',
          height: '350px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          resize: 'none'
        }}
      />
    </div>
  );
};

export default DebugPanel;