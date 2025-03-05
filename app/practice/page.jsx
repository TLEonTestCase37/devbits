"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "../components/sidebar";
import { useAuth } from "../context/AuthContext";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function PracticePage() {
  const [problems, setProblems] = useState([]);
  const [wrongSubmissionsByTag, setWrongSubmissionsByTag] = useState({});
  const [wrongSubmissionsByRating, setWrongSubmissionsByRating] = useState({});
  const [graphType, setGraphType] = useState("tags");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const problemsResponse = await fetch("https://codeforces.com/api/problemset.problems");
        const problemsData = await problemsResponse.json();
        if (problemsData.status === "OK") {
          setProblems(problemsData.result.problems);
        }

        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const cfHandle = userSnap.data().cfId;

          const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}`);
          const submissionsData = await submissionsResponse.json();

          if (submissionsData.status === "OK") {
            const wrongAnsByTag = {};
            const wrongAnsByRating = {};
            const solved = new Set();
            submissionsData.result.forEach((submission) => {
              const problem = submission.problem;
              const problemId = `${problem.contestId}${problem.index}`;
              if (submission.verdict === "OK") {
                solved.add(problemId);
              } else if (submission.verdict === "WRONG_ANSWER") {
                problem.tags.forEach(tag => {
                  wrongAnsByTag[tag] = (wrongAnsByTag[tag] || 0) + 1;
                });
                const rating = problem.rating || "Unrated";
                wrongAnsByRating[rating] = (wrongAnsByRating[rating] || 0) + 1;
              }
            });
            setWrongSubmissionsByTag(wrongAnsByTag);
            setWrongSubmissionsByRating(wrongAnsByRating);
            setSolvedProblems(solved);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (Object.keys(wrongSubmissionsByTag).length > 0 || Object.keys(wrongSubmissionsByRating).length > 0) {
      const category = graphType === "tags" ? Object.keys(wrongSubmissionsByTag)[0] : Object.keys(wrongSubmissionsByRating)[0];
      handleCategoryClick(category);
    }
  }, [wrongSubmissionsByTag, wrongSubmissionsByRating, graphType]);

  const tagChartData = {
    labels: Object.keys(wrongSubmissionsByTag),
    datasets: [
      {
        data: Object.values(wrongSubmissionsByTag),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
      },
    ],
  };

  const ratingChartData = {
    labels: Object.keys(wrongSubmissionsByRating),
    datasets: [
      {
        label: 'Wrong Submissions by Rating',
        data: Object.values(wrongSubmissionsByRating),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const suggestProblemsByRating = (totalProblems = 100) => {
    const totalWA = Object.values(wrongSubmissionsByRating).reduce((a, b) => a + b, 0);
    const suggestedProblems = [];

    for (const [rating, count] of Object.entries(wrongSubmissionsByRating)) {
      const numProblems = Math.round((count / totalWA) * totalProblems);
      const ratingProblems = problems.filter(p => 
        p.rating === parseInt(rating) && 
        !solvedProblems.has(`${p.contestId}${p.index}`)
      );
      
      suggestedProblems.push(...ratingProblems.slice(0, numProblems));
    }

    return suggestedProblems.slice(0, totalProblems);
  };

  const suggestProblemsByTags = (totalProblems = 100) => {
    const totalWA = Object.values(wrongSubmissionsByTag).reduce((a, b) => a + b, 0);
    const tagWeights = {};
    const suggestedProblems = [];

    for (const [tag, count] of Object.entries(wrongSubmissionsByTag)) {
      tagWeights[tag] = count / totalWA;
    }

    const scoreProblem = (problem) => {
      return problem.tags.reduce((score, tag) => score + (tagWeights[tag] || 0), 0);
    };

    const sortedProblems = problems
      .filter(p => !solvedProblems.has(`${p.contestId}${p.index}`))
      .sort((a, b) => scoreProblem(b) - scoreProblem(a));

    return sortedProblems.slice(0, totalProblems);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    let suggestedProblems;
    if (graphType === "tags") {
      suggestedProblems = suggestProblemsByTags();
    } else {
      suggestedProblems = suggestProblemsByRating();
    }
    setFilteredProblems(suggestedProblems);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {user && <Sidebar user={user} />}

      <h1 className="text-3xl font-bold mb-6">Practice Page</h1>

      <div className="w-full md:w-[70%] mb-4">
        <select 
          className="bg-gray-800 text-white p-2 rounded"
          onChange={(e) => setGraphType(e.target.value)}
          value={graphType}
        >
          <option value="tags">Wrong Submissions by Tags</option>
          <option value="rating">Wrong Submissions by Rating</option>
        </select>
      </div>

      <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
        {graphType === "tags" ? (
          <Pie data={tagChartData} />
        ) : (
          <Bar data={ratingChartData} />
        )}
      </div>

      {selectedCategory && (
        <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Suggested Problems for {selectedCategory}</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Name</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Rating</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Tags</th>
              </tr>
            </thead>
            <tbody>
  {filteredProblems.slice().reverse().map((problem, index) => (
    <tr key={index} className="hover:bg-gray-700">
      <td className="py-2 px-4">
        <a
          href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {problem.name}
        </a>
      </td>
      <td className="py-2 px-4">{problem.rating || "N/A"}</td>
      <td className="py-2 px-4">{problem.tags.join(", ")}</td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
}
