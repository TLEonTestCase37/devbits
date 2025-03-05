"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from '../components/sidebar';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [searchHandle, setSearchHandle] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserSubmissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserSubmissions = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const cfHandle = userSnap.data().cfId;
      await fetchSubmissions(cfHandle);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      setLoading(false);
    }
  };

  const fetchSubmissions = async (handle) => {
    setLoading(true);
    try {
      const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100`);
      const data = await response.json();
      if (data.status === "OK") {
        setSubmissions(data.result);
      } else {
        console.error("Error fetching submissions:", data.comment);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchHandle) {
      fetchSubmissions(searchHandle);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {user && <Sidebar user={user} />}
      <h1 className="text-3xl font-bold mb-6">Codeforces Submissions</h1>

      <form onSubmit={handleSearch} className="w-full md:w-[70%] mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchHandle}
            onChange={(e) => setSearchHandle(e.target.value)}
            placeholder="Enter Codeforces handle"
            className="flex-grow bg-gray-800 text-white p-2 rounded"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <p>Loading submissions...</p>
      ) : (
        <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Problem</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Verdict</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Time</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Memory</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Submission Date</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Submission Link</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="py-2 px-4">
                    <a
                      href={`https://codeforces.com/problemset/problem/${submission.problem.contestId}/${submission.problem.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {submission.problem.name}
                    </a>
                  </td>
                  <td className={`py-2 px-4 ${submission.verdict === "OK" ? "text-green-500" : "text-red-500"}`}>
                    {submission.verdict}
                  </td>
                  <td className="py-2 px-4">{submission.timeConsumedMillis} ms</td>
                  <td className="py-2 px-4">{Math.round(submission.memoryConsumedBytes / 1024)} KB</td>
                  <td className="py-2 px-4">{formatDate(submission.creationTimeSeconds)}</td>
                  <td className="py-2 px-4">
                    <a
                      href={`https://codeforces.com/contest/${submission.contestId}/submission/${submission.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
