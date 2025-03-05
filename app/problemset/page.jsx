"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Problemset() {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [wrongAns, setWrongAns] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [ratingRange, setRatingRange] = useState([800, 3500]);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const problemsPerPage = 100;

  const tags = [
    "implementation", "dp", "math", "greedy", "brute force", 
    "data structures", "constructive algorithms", "dfs and similar", 
    "sortings", "binary search", "graphs", "trees", "strings", "number theory",
    "geometry", "combinatorics", "two pointers", "dsu", "bitmasks", "probabilities"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const problemsResponse = await fetch("https://codeforces.com/api/problemset.problems");
        const problemsData = await problemsResponse.json();
        if (problemsData.status === "OK") {
          setProblems(problemsData.result.problems);
          setFilteredProblems(problemsData.result.problems);
        }

        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const cfHandle = userSnap.data().cfId;

          const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}`);
          const submissionsData = await submissionsResponse.json();

          if (submissionsData.status === "OK") {
            const solved = new Set();
            const wrong = new Set();
            submissionsData.result.forEach((submission) => {
              const problemId = `${submission.problem.contestId}${submission.problem.index}`;
              if (submission.verdict === "OK") {
                solved.add(problemId);
              } else if (submission.verdict === "WRONG_ANSWER") {
                wrong.add(problemId);
              }
            });
            setSolvedProblems(solved);
            setWrongAns(wrong);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const applyFiltersAndSort = () => {
    let filtered = [...problems];

    // Apply tag filtering
    if (selectedTags.length > 0) {
      filtered = filtered.filter(problem => 
        selectedTags.every(tag => problem.tags.includes(tag))
      );
    }

    // Apply rating range filtering
    filtered = filtered.filter(problem => 
      problem.rating >= ratingRange[0] && problem.rating <= ratingRange[1]
    );

    // Sort by most recent first (assuming higher contestId means more recent)
    filtered.sort((a, b) => b.contestId - a.contestId || a.index.localeCompare(b.index));

    setFilteredProblems(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Codeforces Problemset</h1>
      
      {/* Filtering controls */}
      <div className="w-full md:w-[70%] mb-4 flex flex-wrap gap-4">
        <div className="relative">
          <button 
            className="bg-gray-800 text-white p-2 rounded"
            onClick={() => setShowTagsDropdown(!showTagsDropdown)}
          >
            Select Tags
          </button>
          {showTagsDropdown && (
            <div className="absolute z-10 bg-gray-800 mt-1 p-2 rounded shadow-lg">
              {tags.map(tag => (
                <label key={tag} className="block">
                  <input 
                    type="checkbox" 
                    value={tag} 
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag]);
                      } else {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      }
                    }}
                  /> {tag}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            className="bg-gray-800 text-white p-2 rounded w-20"
            value={ratingRange[0]} 
            onChange={(e) => setRatingRange([parseInt(e.target.value), ratingRange[1]])}
          />
          <span>-</span>
          <input 
            type="number" 
            className="bg-gray-800 text-white p-2 rounded w-20"
            value={ratingRange[1]} 
            onChange={(e) => setRatingRange([ratingRange[0], parseInt(e.target.value)])}
          />
        </div>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={applyFiltersAndSort}
        >
          Apply Filters
        </button>
      </div>

      {/* Problem table */}
      <div className="w-full md:w-[70%] bg-gray-800 p-4 rounded-lg shadow-lg">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border-b border-gray-700 py-2 px-4 text-left">#</th>
              <th className="border-b border-gray-700 py-2 px-4 text-left">Name</th>
              <th className="border-b border-gray-700 py-2 px-4 text-left">Tags</th>
              <th className="border-b border-gray-700 py-2 px-4 text-left">Rating</th>
            </tr>
          </thead>
          <tbody>
            {currentProblems.map((problem, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-700 ${
                  solvedProblems.has(`${problem.contestId}${problem.index}`)
                    ? "bg-green-800"
                    : wrongAns.has(`${problem.contestId}${problem.index}`)
                    ? "bg-red-800"
                    : ""
                }`}
              >
                <td className="py-2 px-4">{indexOfFirstProblem + index + 1}</td>
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
                <td className="py-2 px-4">{problem.tags.join(", ") || "N/A"}</td>
                <td className="py-2 px-4">{problem.rating || "N/A"}</td>
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
            currentPage === 1 ? "bg-gray-600 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Previous
        </button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg ${
            currentPage === totalPages ? "bg-gray-600 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
