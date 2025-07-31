import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Generic Firebase service functions
export const firebaseService = {
  // Create a new document
  create: async (collectionName, data, userId) => {
    console.log(`[FirebaseService] Creating document in ${collectionName}:`, data);
    console.log(`[FirebaseService] User ID:`, userId);
    
    try {
      const docData = {
        ...data,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`[FirebaseService] Final document data:`, docData);
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      console.log(`[FirebaseService] Document created with ID:`, docRef.id);
      
      const result = { id: docRef.id, ...data, userId, createdAt: docData.createdAt, updatedAt: docData.updatedAt };
      console.log(`[FirebaseService] Returning:`, result);
      
      return result;
    } catch (error) {
      console.error(`[FirebaseService] Error creating document in ${collectionName}:`, error);
      console.error(`[FirebaseService] Error code:`, error.code);
      console.error(`[FirebaseService] Error message:`, error.message);
      throw error;
    }
  },

  // Update an existing document
  update: async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      return { id: docId, ...data };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete a document
  delete: async (collectionName, docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return docId;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Get all documents for a user
  getAll: async (collectionName, userId) => {
    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  },

  // Get a single document
  getOne: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribe: (collectionName, userId, callback) => {
    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(data);
      });
    } catch (error) {
      console.error('Error subscribing to updates:', error);
      throw error;
    }
  }
};

// Specific service functions for each data type
export const transactionService = {
  create: (transaction, userId) => firebaseService.create('transactions', transaction, userId),
  update: (id, transaction) => firebaseService.update('transactions', id, transaction),
  delete: (id) => firebaseService.delete('transactions', id),
  getAll: (userId) => firebaseService.getAll('transactions', userId),
  subscribe: (userId, callback) => firebaseService.subscribe('transactions', userId, callback)
};

export const categoryService = {
  create: (category, userId) => firebaseService.create('categories', category, userId),
  update: (id, category) => firebaseService.update('categories', id, category),
  delete: (id) => firebaseService.delete('categories', id),
  getAll: (userId) => firebaseService.getAll('categories', userId),
  subscribe: (userId, callback) => firebaseService.subscribe('categories', userId, callback)
};

export const budgetService = {
  create: (budget, userId) => firebaseService.create('budgets', budget, userId),
  update: (id, budget) => firebaseService.update('budgets', id, budget),
  delete: (id) => firebaseService.delete('budgets', id),
  getAll: (userId) => firebaseService.getAll('budgets', userId),
  subscribe: (userId, callback) => firebaseService.subscribe('budgets', userId, callback)
};

export const goalService = {
  create: (goal, userId) => firebaseService.create('goals', goal, userId),
  update: (id, goal) => firebaseService.update('goals', id, goal),
  delete: (id) => firebaseService.delete('goals', id),
  getAll: (userId) => firebaseService.getAll('goals', userId),
  subscribe: (userId, callback) => firebaseService.subscribe('goals', userId, callback)
};

export const recurringTransactionService = {
  create: (recurringTransaction, userId) => firebaseService.create('recurringTransactions', recurringTransaction, userId),
  update: (id, recurringTransaction) => firebaseService.update('recurringTransactions', id, recurringTransaction),
  delete: (id) => firebaseService.delete('recurringTransactions', id),
  getAll: (userId) => firebaseService.getAll('recurringTransactions', userId),
  subscribe: (userId, callback) => firebaseService.subscribe('recurringTransactions', userId, callback)
};