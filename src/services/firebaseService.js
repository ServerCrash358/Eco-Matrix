// src/services/firebaseService.js
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

// --- AUTH FUNCTIONS ---

export const signUpUser = async (email, password) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  // Store user details in Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    createdAt: new Date(),
  });

  return user;
};

export const signInUser = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};

export const logOutUser = async () => {
  await signOut(auth);
};

// --- FIRESTORE FUNCTIONS ---

export const addData = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

export const getAllData = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getUserData = async (uid) => {
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? docSnap.data() : null;
};
