"use client";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import CFVerification from "./components/CFVerification";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Chart from "chart.js/auto";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [ratingData, setRatingData] = useState([]);

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
              await fetchUserInfo(cfId);
              await fetchRatingData(cfId);
            }
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      } else {
        setUserInfo(null);
        setRatingData([]);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchUserInfo(cfId) {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${cfId}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      setUserInfo(data.result[0]);
    }
  }

  async function fetchRatingData(handle) {
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.rating?handle=${handle}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setRatingData(data.result);
        plotRatingGraph(data.result);
      }
    } catch (error) {
      console.error("Error fetching rating data:", error);
    }
  }

  function plotRatingGraph(ratingData) {
    const ctx = document.getElementById("ratingChart").getContext("2d");
    const labels = ratingData.map((entry) =>
      new Date(entry.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
    );
    const ratings = ratingData.map((entry) => entry.newRating);

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Rating",
            data: ratings,
            fill: false,
            borderColor: "rgba(34, 197, 94, 1)",
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { font: { weight: "bold" } },
          },
          y: {
            beginAtZero: false,
            ticks: { font: { weight: "bold" } },
          },
        },
        plugins: {
          legend: {
            labels: { font: { weight: "bold" } },
          },
        },
      },
    });
  }

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  function getHandleColor(rating) {
    if (rating >= 3000) return "text-[#FF0000]";
    if (rating >= 2600) return "text-[#FF0000]";
    if (rating >= 2400) return "text-[#FF8C00]";
    if (rating >= 2300) return "text-[#FF8C00]";
    if (rating >= 2100) return "text-[#FF8C00]";
    if (rating >= 1900) return "text-[#AA00AA]";
    if (rating >= 1600) return "text-[#0000FF]";
    if (rating >= 1400) return "text-[#03A89E]";
    if (rating >= 1200) return "text-[#008000]";
    return "text-[#808080]";
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen fixed left-0 top-0">
        <h1 className="text-2xl font-bold mb-8">Codeforces Tracker</h1>
        <nav className="flex-grow">
          <ul className="space-y-2">
            <li><Link href="/" className="block py-2 px-4 hover:bg-gray-700 rounded">Home</Link></li>
            <li><Link href="/contests" className="block py-2 px-4 hover:bg-gray-700 rounded">Contests</Link></li>
            <li><Link href="/problemset" className="block py-2 px-4 hover:bg-gray-700 rounded">Problemset</Link></li>
            <li><Link href="/friends" className="block py-2 px-4 hover:bg-gray-700 rounded">Friends</Link></li>
            <li><Link href="/submissions" className="block py-2 px-4 hover:bg-gray-700 rounded">Submissions</Link></li>
          </ul>
        </nav>
        {user && (
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out mt-auto"
          >
            Log out
          </button>
        )}
      </div>
  
      {/* Main content */}
      <div className="ml-64 p-8 flex-grow">
        <h1 className="text-3xl font-bold text-white mb-8">Welcome to Codeforces Tracker</h1>
        {user ? (
          <div className="flex flex-col items-center w-full md:w-[70%]">
            {userInfo ? (
              <>
                <div className="w-full bg-gray-100 p-4 md:p-6 rounded-lg shadow-xl mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <img
                      src={userInfo.titlePhoto}
                      alt={`${userInfo.handle}'s profile`}
                      className="w-32 h-32 rounded-full border-4 border-white"
                    />
                  </div>
                  <h2 className={`text-2xl font-bold mb-4 text-center ${getHandleColor(userInfo.rating)}`}>
                    {userInfo.handle}
                  </h2>
                  <div className="text-lg text-gray-800">
                    <p className="mb-2">
                      Rank: <span className={`font-semibold ${getHandleColor(userInfo.rating)}`}>
                        {userInfo.rank || "N/A"}
                      </span>
                    </p>
                    <p className="mb-2">
                      Rating: <span className={`font-semibold ${getHandleColor(userInfo.rating)}`}>
                        {userInfo.rating || "N/A"}
                      </span>
                    </p>
                    <p>
                      Max Rating: <span className={`font-semibold ${getHandleColor(userInfo.maxRating)}`}>
                        {userInfo.maxRating || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 p-4 md:p-6 rounded-lg shadow-xl mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Rating History</h2>
                  <div className="h-[400px]">
                    <canvas id="ratingChart" className="w-full h-full"></canvas>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-white">Loading user info...</p>
            )}
            <CFVerification />
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
    </div>
  );
  
}
