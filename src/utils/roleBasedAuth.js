import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export const USER_ROLES = {
  CITIZEN: 'citizen',
  ADMIN: 'admin',
  DRIVER: 'driver'
};

export const signUpWithRole = async (email, password, role, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: role,
      createdAt: new Date(),
      ...additionalData
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().role : null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

export const signInWithRole = async (email, password, expectedRole) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userRole = await getUserRole(user.uid);
    
    if (userRole !== expectedRole) {
      throw new Error(`Access denied. This login is for ${expectedRole} users only.`);
    }
    
    return { user, role: userRole };
  } catch (error) {
    throw error;
  }
};
