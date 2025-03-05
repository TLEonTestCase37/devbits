"use client";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import CFVerification from "./components/CFVerification";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth State Changed:", user);
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("User signed in:", result.user);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Welcome to Codeforces Tracker</h1>
      {user ? (
        <CFVerification />
      ) : (
        <button 
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Please Log in
        </button>
      )}
    </div>
  );
}
