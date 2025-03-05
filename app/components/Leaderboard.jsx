// components/Leaderboard.jsx
"use client";

import { useState, useEffect } from 'react';

export default function Leaderboard({ submissions, problems, contest }) {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        if (!submissions || !problems || !contest) return;

        // Calculate contest start time (convert Firestore Timestamp to Date)
        const startTime = contest.startTime instanceof Date ? contest.startTime : new Date(contest.startTime.seconds * 1000);

        // Initialize a map to store user scores
        const userScores = new Map();

        // Iterate over each submission to calculate scores
        submissions.forEach(submission => {
            const userId = submission.userId;
            const problemId = submission.problemId;

            // Calculate submission time relative to contest start (in minutes)
            const submissionTime = Math.max(0, Math.floor((submission.submissionTime.seconds * 1000 - startTime.getTime()) / (60 * 1000)));

            // Check if the user already has a score entry
            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    userId: userId,
                    name: submission.userName,
                    solved: 0,
                    penalty: 0,
                    lastSubmission: 0,
                    problems: new Map()  // Use a map to store problems for each user
                });
            }

            // Get the user's score entry
            const userScore = userScores.get(userId);

            // Check if the problem has already been solved by the user
            if (!userScore.problems.has(problemId)) {
                // Mark the problem as attempted
                userScore.problems.set(problemId, { attempts: 1, solved: false });

                // If the submission is correct, update the user's score
                if (submission.verdict === 'OK') {
                    userScore.solved++;
                    userScore.penalty += submissionTime + (userScore.problems.get(problemId).attempts - 1) * 20;
                    userScore.lastSubmission = Math.max(userScore.lastSubmission, submissionTime);
                    userScore.problems.get(problemId).solved = true;
                }
            } else {
                // Increment the attempts count for the problem
                userScore.problems.get(problemId).attempts++;
            }
        });

        // Convert the map to an array and sort it
        const sortedLeaderboard = Array.from(userScores.values()).sort((a, b) => {
            if (b.solved !== a.solved) {
                return b.solved - a.solved;
            } else if (a.penalty !== b.penalty) {
                return a.penalty - b.penalty;
            } else {
                return a.lastSubmission - b.lastSubmission;
            }
        });

        // Update the leaderboard state
        setLeaderboard(sortedLeaderboard);
    }, [submissions, problems, contest]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            {leaderboard.length > 0 ? (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2">Rank</th>
                            <th className="py-2">User</th>
                            <th className="py-2">Solved</th>
                            <th className="py-2">Penalty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, index) => (
                            <tr key={entry.userId} className="border-b">
                                <td className="py-2">{index + 1}</td>
                                <td className="py-2">{entry.name}</td>
                                <td className="py-2">{entry.solved}</td>
                                <td className="py-2">{entry.penalty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No submissions yet.</p>
            )}
        </div>
    );
}
