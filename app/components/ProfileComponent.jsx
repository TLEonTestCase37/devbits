"use client";

import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function ProfileComponent({ handle }) {
  const [userInfo, setUserInfo] = useState(null);
  const [ratingData, setRatingData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchUserInfo(handle);
    fetchRatingData(handle);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [handle]);

  async function fetchUserInfo(cfId) {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${cfId}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      setUserInfo(data.result[0]);
    } else {
      setUserInfo(null);
      console.error("User not found");
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
    const ctx = document.getElementById(`ratingChart-${handle}`);
    
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    const labels = ratingData.map((entry) =>
      new Date(entry.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
    );
    const ratings = ratingData.map((entry) => entry.newRating);

    chartRef.current = new Chart(ctx, {
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

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full md:w-[70%]">
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
          <canvas id={`ratingChart-${handle}`} className="w-full h-full"></canvas>
        </div>
      </div>
    </div>
  );
}
