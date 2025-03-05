// custom-contests/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import Leaderboard from "../../components/Leaderboard"; // Import the Leaderboard component
import { useAuth } from "@/app/context/AuthContext";

export default function ContestPage() {
  const [contest, setContest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isContestEnded, setIsContestEnded] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const id = params.id;

  useEffect(() => {
    if (!id) return;

    const fetchContest = async () => {
      const contestRef = doc(db, "contests", id);
      const contestSnap = await getDoc(contestRef);

      if (contestSnap.exists()) {
        // Convert Firestore Timestamp to JavaScript Date
        const contestData = contestSnap.data();
        if (contestData.startTime) {
          contestData.startTime = contestData.startTime.toDate();
        }
        setContest(contestData);
      } else {
        router.push("/custom-contests");
      }
    };

    fetchContest();

    const submissionsQuery = query(
      collection(db, "submissions"),
      where("contestId", "==", id)
    );
    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsData);
    });

    return () => unsubscribe();
  }, [id, router]);

  useEffect(() => {
    if (!contest) return;

    // Ensure contest.startTime is a Date object
    const startTime = contest.startTime instanceof Date ? contest.startTime : new Date(contest.startTime);

    const endTime = new Date(startTime.getTime() + contest.duration * 60000); // Contest end time
    const checkContestEnd = () => {
      if (new Date() >= endTime) {
        setIsContestEnded(true);
      }
    };

    // Check immediately and then every second
    checkContestEnd();
    const timer = setInterval(checkContestEnd, 1000);

    return () => clearInterval(timer); // Cleanup the interval
  }, [contest]);

  if (!contest) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">{contest.name}</h1>

      <div className="flex w-full max-w-5xl">
        {/* Problems Section */}
        <div className="w-1/2 p-4">
          <h2 className="text-2xl font-bold mb-4">Problems</h2>
          {contest.problems.map((problem, index) => (
            <div key={problem.id} className="mb-2">
              <a
                href={`https://codeforces.com/problemset/problem/${problem.id.slice(
                  0,
                  -1
                )}/${problem.id.slice(-1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {String.fromCharCode(65 + index)}. {problem.name} (Rating: {problem.rating})
              </a>
            </div>
          ))}
        </div>

        {/* Leaderboard Section */}
        <div className="w-1/2 p-4">
          <Leaderboard submissions={submissions} problems={contest.problems} contest={contest} />
        </div>
      </div>
    </div>
  );
}
