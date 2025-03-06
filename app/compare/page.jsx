"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/sidebar";
import Chart from "chart.js/auto";

export default function ComparePage() {
  const [handle1, setHandle1] = useState("");
  const [handle2, setHandle2] = useState("");
  const [userInfo1, setUserInfo1] = useState(null);
  const [userInfo2, setUserInfo2] = useState(null);
  const [ratingData1, setRatingData1] = useState([]);
  const [ratingData2, setRatingData2] = useState([]);
  const [contestHistory1, setContestHistory1] = useState([]);
  const [contestHistory2, setContestHistory2] = useState([]);
  const [commonContests, setCommonContests] = useState([]);
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);

  useEffect(() => {
    return () => {
      if (chartRef1.current) {
        chartRef1.current.destroy();
      }
      if (chartRef2.current) {
        chartRef2.current.destroy();
      }
    };
  }, []);

  async function handleCompare(e) {
    e.preventDefault();
    setError1("");
    setError2("");
    setUserInfo1(null);
    setUserInfo2(null);
    setRatingData1([]);
    setRatingData2([]);
    setContestHistory1([]);
    setContestHistory2([]);
    setCommonContests([]);

    const user1Info = await fetchUserInfo(handle1, setUserInfo1, setError1);
    const user2Info = await fetchUserInfo(handle2, setUserInfo2, setError2);

    if (user1Info) {
      await fetchRatingData(handle1, setRatingData1, 1);
      await fetchContestHistory(handle1, setContestHistory1);
    }

    if (user2Info) {
      await fetchRatingData(handle2, setRatingData2, 2);
      await fetchContestHistory(handle2, setContestHistory2);
    }
    findCommonContests(contestHistory1, contestHistory2);
  }

  async function fetchUserInfo(handle, setUserInfo, setError) {
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.info?handles=${handle}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setUserInfo(data.result[0]);
        return data.result[0];
      } else {
        setUserInfo(null);
        setError("User not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setError("Network problem?");
      return null;
    }
  }

  async function fetchRatingData(handle, setRatingData, userNum) {
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.rating?handle=${handle}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setRatingData(data.result);
        plotRatingGraph(data.result, userNum); // Pass userNum to the plotting function
      }
    } catch (error) {
      console.error("Error fetching rating data:", error);
    }
  }

  async function fetchContestHistory(handle, setContestHistory) {
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.rating?handle=${handle}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setContestHistory(data.result);
      }
    } catch (error) {
      console.error("Error fetching contest history:", error);
    }
  }

  function findCommonContests(history1, history2) {
    const common = [];
    history1.forEach((contest1) => {
      history2.forEach((contest2) => {
        if (contest1.contestId === contest2.contestId) {
          common.push({
            contestId: contest1.contestId,
            contestName: contest1.contestName,
            rank1: contest1.rank,
            rank2: contest2.rank,
          });
        }
      });
    });
    setCommonContests(common);
  }

  function getHandleColor(rating) {
    if (rating >= 3000) return "text-[#FF0000]";
    if (rating >= 2600) return "text-[#FF0000]";
    if (rating >= 2400) return "text-[#FF8C00]";
    if (rating >= 2300) return "text-[#FF8C00]";
    if (rating >= 2100) return "text-[#AA00AA]";
    if (rating >= 1900) return "text-[#0000FF]";
    if (rating >= 1600) return "text-[#03A89E]";
    if (rating >= 1400) return "text-[#008000]";
    return "text-[#808080]";
  }

  function plotRatingGraph(ratingData, userNum) {
    const ctx = document.getElementById(`ratingChart${userNum}`);
    const chartRef = userNum === 1 ? chartRef1 : chartRef2;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = ratingData.map((entry) =>
      new Date(entry.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
    );
    const ratings = ratingData.map((entry) => entry.newRating);
    const color =
      userNum === 1 ? "rgba(34, 197, 94, 1)" : "rgba(54, 162, 235, 1)"; // Different colors for each user

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `Rating (User ${userNum})`,
            data: ratings,
            fill: false,
            borderColor: color,
            backgroundColor: color.replace("1)", "0.2)"), //Lighten background
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

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {user && <Sidebar user={user} />}

      <div className="ml-64 p-8 flex-grow">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-8">
            Compare Codeforces Profiles
          </h1>
          <form onSubmit={handleCompare} className="space-y-4">
            <div>
              <label
                htmlFor="handle1"
                className="block text-lg font-semibold text-white"
              >
                Handle 1
              </label>
              <input
                type="text"
                name="handle1"
                id="handle1"
                className="mt-1 block w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                value={handle1}
                onChange={(e) => setHandle1(e.target.value)}
              />
              {error1 && <p className="text-red-500 text-sm">{error1}</p>}
            </div>
            <div>
              <label
                htmlFor="handle2"
                className="block text-lg font-semibold text-white"
              >
                Handle 2
              </label>
              <input
                type="text"
                name="handle2"
                id="handle2"
                className="mt-1 block w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                value={handle2}
                onChange={(e) => setHandle2(e.target.value)}
              />
              {error2 && <p className="text-red-500 text-sm">{error2}</p>}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
            >
              Compare
            </button>
          </form>
        </div>

        {userInfo1 && userInfo2 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User 1 Profile */}
            <div className="bg-gray-700 rounded-lg shadow-md p-4">
              <div className="flex items-center justify-center mb-4">
                <img
                  src={userInfo1.titlePhoto}
                  alt={`${userInfo1.handle}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-white bg-white"
                />
              </div>

              <h2 className="text-xl font-semibold text-white mb-2 text-center">
                <span className={getHandleColor(userInfo1.rating)}>
                  {userInfo1.handle}
                </span>
              </h2>
              <p className="text-gray-300 text-center">
                Rank:{" "}
                <span className={getHandleColor(userInfo1.rating)}>
                  {userInfo1.rank}
                </span>
              </p>
              <p className="text-gray-300 text-center">
                Rating:{" "}
                <span className={getHandleColor(userInfo1.rating)}>
                  {userInfo1.rating}
                </span>
              </p>
              <p className="text-gray-300 text-center">
                Max Rating:{" "}
                <span className={getHandleColor(userInfo1.maxRating)}>
                  {userInfo1.maxRating}
                </span>
              </p>

              <div className="w-full bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mt-4">
                <h2 className="text-xl font-bold mb-2 text-white">
                  Rating History
                </h2>
                <div className="h-[300px]">
                  <canvas id="ratingChart1" className="w-full h-full"></canvas>
                </div>
              </div>
            </div>

            {/* User 2 Profile */}
            <div className="bg-gray-700 rounded-lg shadow-md p-4">
              <div className="flex items-center justify-center mb-4">
                <img
                  src={userInfo2.titlePhoto}
                  alt={`${userInfo2.handle}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-white bg-white"
                />
              </div>

              <h2 className="text-xl font-semibold text-white mb-2 text-center">
                <span className={getHandleColor(userInfo2.rating)}>
                  {userInfo2.handle}
                </span>
              </h2>
              <p className="text-gray-300 text-center">
                Rank:{" "}
                <span className={getHandleColor(userInfo2.rating)}>
                  {userInfo2.rank}
                </span>
              </p>
              <p className="text-gray-300 text-center">
                Rating:{" "}
                <span className={getHandleColor(userInfo2.rating)}>
                  {userInfo2.rating}
                </span>
              </p>
              <p className="text-gray-300 text-center">
                Max Rating:{" "}
                <span className={getHandleColor(userInfo2.maxRating)}>
                  {userInfo2.maxRating}
                </span>
              </p>

              <div className="w-full bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mt-4">
                <h2 className="text-xl font-bold mb-2 text-white">
                  Rating History
                </h2>
                <div className="h-[300px]">
                  <canvas id="ratingChart2" className="w-full h-full"></canvas>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Common Contests Table */}
        {commonContests.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6 overflow-x-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Common Contests
            </h2>
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-2 text-white">Contest</th>
                  <th className="px-4 py-2 text-white">{handle1} Rank</th>
                  <th className="px-4 py-2 text-white">{handle2} Rank</th>
                </tr>
              </thead>
              <tbody>
                {commonContests.map((contest) => (
                  <tr key={contest.contestId} className="bg-gray-900">
                    <td className="border px-4 py-2 text-white">
                      {contest.contestName}
                    </td>
                    <td className="border px-4 py-2 text-white">
                      {contest.rank1}
                    </td>
                    <td className="border px-4 py-2 text-white">
                      {contest.rank2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
