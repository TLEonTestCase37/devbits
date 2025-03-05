// app/custom-contests/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from "@/app/context/AuthContext";
import ProblemsetSelector from "../components/ProblemsetSelector";
import Sidebar from "@/app/components/sidebar";

export default function CustomContestsPage() {
  const [contestName, setContestName] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contests, setContests] = useState([]); // State to hold contests
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch contests from Firestore
    const fetchContests = async () => {
      const contestsCollection = collection(db, "contests");
      const contestsSnapshot = await getDocs(contestsCollection);
      const contestsList = contestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setContests(contestsList);
    };

    fetchContests();
  }, []);

  const handleCreate = async () => {
    try {
      if (!contestName || !duration || !startTime) {
        alert('Please fill in all fields to create a contest.');
        return;
      }

      const contestRef = await addDoc(collection(db, "contests"), {
        name: contestName,
        duration: parseInt(duration),
        startTime: new Date(startTime),
        problems: selectedProblems,
        createdAt: new Date(),
      });

      const contestId = contestRef.id;
      router.push(`/custom-contests/${contestId}`);
    } catch (error) {
      console.error("Error creating contest:", error);
    }
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {user && <Sidebar user={user} />}

      <h1 className="text-3xl font-bold mb-6">Custom Contests</h1>

      {/* Display Existing Contests */}
      <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Existing Contests</h2>
        {contests.length > 0 ? (
          <ul>
            {contests.map(contest => (
              <li key={contest.id} className="py-2 border-b border-gray-700 last:border-b-0">
                <a href={`/custom-contests/${contest.id}`} className="text-blue-400 hover:underline">
                  {contest.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No contests found.</p>
        )}
      </div>

      {/* Create Contest Section */}
      <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-2">
          {showCreateForm ? 'Create a Contest' : 'Want to Create a Contest?'}
        </h2>
        {showCreateForm ? (
          <>
            <input
              type="text"
              placeholder="Contest Name"
              value={contestName}
              onChange={(e) => setContestName(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded mb-4"
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded mb-4"
            />
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded mb-4"
            />
            <ProblemsetSelector
              selectedProblems={selectedProblems}
              setSelectedProblems={setSelectedProblems}
            />
            <button
              onClick={handleCreate}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Create Contest
            </button>
          </>
        ) : (
          <button
            onClick={toggleCreateForm}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Contest
          </button>
        )}
      </div>
    </div>
  );
}
