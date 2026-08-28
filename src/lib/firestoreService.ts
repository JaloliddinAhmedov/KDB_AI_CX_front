import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { NavTab, KnowledgeItem, UserProfile, UserRole } from '../types';
import { INITIAL_KNOWLEDGE_ITEMS } from '../data/mockData';

const KNOWLEDGE_COLLECTION = 'knowledgeItems';
const USERS_COLLECTION = 'users';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin-1',
    email: 'admin@kdb.uz',
    displayName: 'Javohir Toshmatov',
    role: 'admin',
    department: 'AI Operations & Security',
    avatarColor: 'bg-indigo-600',
    allowedTabs: ['dashboard', 'assistant', 'training', 'transactions', 'support', 'users'],
    createdAt: '2026-01-15'
  },
  {
    uid: 'user-1',
    email: 'operator@kdb.uz',
    displayName: 'Madina Karimova',
    role: 'user',
    department: 'Customer Support Operator',
    avatarColor: 'bg-emerald-600',
    allowedTabs: ['dashboard', 'assistant', 'support', 'transactions'],
    createdAt: '2026-02-10'
  },
  {
    uid: 'user-2',
    email: 'analyst@kdb.uz',
    displayName: 'Sardor Mirzayev',
    role: 'user',
    department: 'Risk & Compliance Analyst',
    avatarColor: 'bg-amber-600',
    allowedTabs: ['dashboard', 'assistant', 'transactions'],
    createdAt: '2026-03-01'
  }
];

// Seed initial knowledge items to Firestore if empty
export const subscribeKnowledgeItems = (callback: (items: KnowledgeItem[]) => void) => {
  const colRef = collection(db, KNOWLEDGE_COLLECTION);
  
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // Seed initial mock data
      for (const item of INITIAL_KNOWLEDGE_ITEMS) {
        await setDoc(doc(db, KNOWLEDGE_COLLECTION, item.id), item);
      }
    } else {
      const items: KnowledgeItem[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as KnowledgeItem);
      });
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore subscription warning, falling back to local memory:', err);
    callback(INITIAL_KNOWLEDGE_ITEMS);
  });
};

export const saveKnowledgeItemToDb = async (item: KnowledgeItem) => {
  try {
    const cleanedItem: any = {};
    Object.entries(item).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanedItem[key] = val;
      }
    });
    const docRef = doc(db, KNOWLEDGE_COLLECTION, item.id);
    await setDoc(docRef, cleanedItem, { merge: true });
  } catch (err) {
    console.error('Error saving knowledge item to Firestore:', err);
  }
};

export const deleteKnowledgeItemFromDb = async (id: string) => {
  try {
    const docRef = doc(db, KNOWLEDGE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting knowledge item from Firestore:', err);
  }
};

// Seed initial users to Firestore if empty
export const subscribeUsers = (callback: (users: UserProfile[]) => void) => {
  const colRef = collection(db, USERS_COLLECTION);
  
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      for (const user of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COLLECTION, user.uid), user);
      }
    } else {
      const users: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        users.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      callback(users);
    }
  }, (err) => {
    console.warn('Firestore users subscription warning, using fallback:', err);
    callback(INITIAL_USERS);
  });
};

export const updateUserRoleInDb = async (uid: string, role: UserRole) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { role });
  } catch (err) {
    console.error('Error updating user role in Firestore:', err);
  }
};

export const updateUserProfileInDb = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, updates);
  } catch (err) {
    console.error('Error updating user profile in Firestore:', err);
  }
};

export const createNewUserInDb = async (user: UserProfile) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userRef, user);
  } catch (err) {
    console.error('Error creating user in Firestore:', err);
  }
};

export const updateUserAllowedTabsInDb = async (uid: string, allowedTabs: NavTab[]) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { allowedTabs });
  } catch (err) {
    console.error('Error updating user allowed tabs in Firestore:', err);
  }
};

export const deleteUserFromDb = async (uid: string) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
};
