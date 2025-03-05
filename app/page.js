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
    <div>
      <h1>Welcome to Codeforces Tracker</h1>
      {user ? (
        <CFVerification />
      ) : (
        <button onClick={handleLogin}>Please Log in</button>
      )}
    </div>
  );
}
