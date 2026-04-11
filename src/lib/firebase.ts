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
  apiKey: "AIzaSyDLIfjHNP45eEFX47y-1WQIKLiuXHPAHJg",
  authDomain: "hrhkfi.firebaseapp.com",
  projectId: "hrhkfi",
  storageBucket: "hrhkfi.firebasestorage.app",
  messagingSenderId: "455623876075",
  appId: "1:455623876075:web:24dfa85bdc876b7a304dae",
  measurementId: "G-7WM3R8F756"
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








