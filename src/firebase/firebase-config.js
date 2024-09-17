import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB4G4hmCoE-y0YdsSBk8Wk9nHEq-MRlwcc",
  authDomain: "scinventory1-57023.firebaseapp.com",
  projectId: "scinventory1-57023",
  storageBucket: "scinventory1-57023.appspot.com",
  messagingSenderId: "57401651388",
  appId: "1:57401651388:web:2d5fda989542b9d16da0b9",
  measurementId: "G-EB1ZL9ZV57"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);
const storage = getStorage(app); 

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, db, storage, googleProvider, facebookProvider };
