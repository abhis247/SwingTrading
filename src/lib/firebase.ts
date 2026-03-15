import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { createUserIfNotExists } from "./createUser";

const firebaseConfig = {
  apiKey: "AIzaSyAc82uQHx3ORRDFmwwf3zjDNjVFGZ-oPO0",
  authDomain: "myproject-4b960.firebaseapp.com",
  projectId: "myproject-4b960",
  storageBucket: "myproject-4b960.firebasestorage.app",
  messagingSenderId: "1092685242749",
  appId: "1:1092685242749:web:728028a6fc6b547c07ec14",
  measurementId: "G-12KTBYDX2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 Enable Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/* ================= GOOGLE LOGIN ================= */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  if (result.user) {
    await createUserIfNotExists(result.user.displayName || "User");
  }

  return result.user;
}

/* ================= EMAIL SIGNUP ================= */

export async function signUpUser(
  name: string,
  email: string,
  password: string,
  phone:string
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password.trim(),
    
  );

  if (credential.user) {
    await updateProfile(credential.user, {
      displayName: name
    });
      // 3️⃣ create supabase user
    await createUserIfNotExists(name,phone);
    
  }

  return credential;
}

/* ================= EMAIL LOGIN ================= */

export async function signInUser(email: string, password: string) {
  return await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password.trim()
  );
}