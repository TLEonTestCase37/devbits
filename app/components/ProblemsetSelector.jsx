import { useState, useEffect } from 'react';

export default function ProblemsetSelector({ selectedProblems, setSelectedProblems }) {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [ratingRange, setRatingRange] = useState([800, 3500]);

  useEffect(() => {
    // Fetch problems from Codeforces API
    const fetchProblems = async () => {
      const response = await fetch('https://codeforces.com/api/problemset.problems');
      const data = await response.json();
      if (data.status === 'OK') {
        setProblems(data.result.problems);
        setFilteredProblems(data.result.problems);
      }
    };
    fetchProblems();
  }, []);

  const applyFilters = () => {
    let filtered = problems.filter(problem => 
      problem.rating >= ratingRange[0] && problem.rating <= ratingRange[1]
    );

    if (selectedTags.length > 0) {
      filtered = filtered.filter(problem => 
        selectedTags.every(tag => problem.tags.includes(tag))
      );
    }

    setFilteredProblems(filtered);
  };

  const toggleProblem = (problem) => {
    if (selectedProblems.some(p => p.id === problem.id)) {
      setSelectedProblems(selectedProblems.filter(p => p.id !== problem.id));
    } else {
      setSelectedProblems([...selectedProblems, problem]);
    }
  };

  return (
    <div>
      {/* Add filter controls here */}
      <div className="mb-4">
        <input
          type="number"
          placeholder="Min Rating"
          value={ratingRange[0]}
          onChange={(e) => setRatingRange([parseInt(e.target.value), ratingRange[1]])}
          className="bg-gray-800 text-white p-2 rounded mr-2"
        />
        <input
          type="number"
          placeholder="Max Rating"
          value={ratingRange[1]}
          onChange={(e) => setRatingRange([ratingRange[0], parseInt(e.target.value)])}
          className="bg-gray-800 text-white p-2 rounded mr-2"
        />
        <button onClick={applyFilters} className="bg-blue-500 text-white p-2 rounded">
          Apply Filters
        </button>
      </div>
      <div className="h-64 overflow-y-auto bg-gray-800 p-4 rounded">
        {filteredProblems.map(problem => (
          <div
            key={`${problem.contestId}${problem.index}`}
            className={`p-2 cursor-pointer ${
              selectedProblems.some(p => p.id === `${problem.contestId}${problem.index}`)
                ? 'bg-blue-500'
                : 'hover:bg-gray-700'
            }`}
            onClick={() => toggleProblem({
              id: `${problem.contestId}${problem.index}`,
              name: problem.name,
              rating: problem.rating
            })}
          >
            {problem.name} (Rating: {problem.rating})
          </div>
        ))}
      </div>
    </div>
  );
}
