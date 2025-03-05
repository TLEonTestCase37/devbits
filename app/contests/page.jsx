"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/sidebar";
export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const contestsPerPage = 100;
  const { user } = useAuth();
  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await fetch("https://codeforces.com/api/contest.list");
      const data = await response.json();
      if (data.status === "OK") {
        setContests(data.result);
        filterContests(data.result, true);
      }
    } catch (error) {
      console.error("Error fetching contests:", error);
    }
  };

  const filterContests = (allContests, isUpcoming) => {
    const filtered = allContests.filter((contest) =>
      isUpcoming ? contest.phase === "BEFORE" : contest.phase === "FINISHED"
    );
    filtered.sort((a, b) =>
      isUpcoming
        ? a.startTimeSeconds - b.startTimeSeconds
        : b.startTimeSeconds - a.startTimeSeconds
    );
    setFilteredContests(filtered);
    setCurrentPage(1);
  };

  const indexOfLastContest = currentPage * contestsPerPage;
  const indexOfFirstContest = indexOfLastContest - contestsPerPage;
  const currentContests = filteredContests.slice(
    indexOfFirstContest,
    indexOfLastContest
  );
  const totalPages = Math.ceil(filteredContests.length / contestsPerPage);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {user && <Sidebar user={user} />}
      <h1 className="text-3xl font-bold mb-6">Codeforces Contests</h1>

      {/* Toggle buttons */}
      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded-lg mr-2 ${
            showUpcoming ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => {
            setShowUpcoming(true);
            filterContests(contests, true);
          }}
        >
          Upcoming Contests
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            !showUpcoming ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => {
            setShowUpcoming(false);
            filterContests(contests, false);
          }}
        >
          Past Contests
        </button>
      </div>

      {/* Contests table */}
      <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border-b border-gray-700 py-2 px-4 text-left">
                Name
              </th>
              <th className="border-b border-gray-700 py-2 px-4 text-left">
                Start Time
              </th>
              <th className="border-b border-gray-700 py-2 px-4 text-left">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {currentContests.map((contest, index) => (
              <tr key={index} className="hover:bg-gray-700">
                <td className="py-2 px-4">
                  <a
                    href={`https://codeforces.com/contest/${contest.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {contest.name}
                  </a>
                </td>
                <td className="py-2 px-4">
                  {new Date(contest.startTimeSeconds * 1000).toLocaleString()}
                </td>
                <td className="py-2 px-4">
                  {Math.floor(contest.durationSeconds / 3600)} hours
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg ${
            currentPage === 1
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Previous
        </button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg ${
            currentPage === totalPages
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
