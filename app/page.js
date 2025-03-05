"use client";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase"; // Ensure you have db imported from your firebase config
import CFVerification from "./components/CFVerification";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth State Changed:", user);
      setUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const cfId = userSnap.data().cfId;
            if (cfId) {
              const response = await fetch(
                `https://codeforces.com/api/user.info?handles=${cfId}`
              );
              const data = await response.json();
              if (data.status === "OK") {
                console.log(data.result[0]);
                setUserInfo(data.result[0]);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      } else {
        setUserInfo(null);
      }
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Function to determine background color based on rating
  function getRatingColor(rating) {
    if (rating >= 2400) return "bg-red-600"; // Legendary Grandmaster
    if (rating >= 2100) return "bg-orange-500"; // Grandmaster
    if (rating >= 1900) return "bg-violet-500"; // International Master
    if (rating >= 1600) return "bg-blue-500"; // Master
    if (rating >= 1400) return "bg-cyan-500"; // Expert
    if (rating >= 1200) return "bg-green-500"; // Specialist
    return "bg-gray-500"; // Newbie or unrated
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Welcome to Codeforces Tracker
      </h1>
      {user ? (
        <div className="flex flex-col items-center">
          {userInfo ? (
            <div className={`p-6 rounded-lg shadow-xl mb-8 w-96 ${getRatingColor(userInfo.rating)}`}>
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={`${userInfo.titlePhoto}`} 
                  alt={`${userInfo.handle}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-white"
                />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center text-white">{userInfo.handle}</h2>
              <div className="text-lg text-white">
                <p className="mb-2">Rank: <span className="font-semibold">{userInfo.rank || "N/A"}</span></p>
                <p className="mb-2">Rating: <span className="font-semibold">{userInfo.rating || "N/A"}</span></p>
                <p>Max Rating: <span className="font-semibold">{userInfo.maxRating || "N/A"}</span></p>
              </div>
            </div>
          ) : (
            <p>Loading user info...</p>
          )}
          <CFVerification />
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
          >
            Log out
          </button>
        </div>
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
