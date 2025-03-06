"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/sidebar";
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';


export default function TeamsPage() {
    const [teams, setTeams] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [showJoinModal, setShowJoinModal] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            fetchTeams();
        }
    }, [user]);

    const fetchTeams = async () => {
        try {
            const teamsRef = collection(db, "teams");
            const q = query(teamsRef, where("members", "array-contains", user.uid));
            const querySnapshot = await getDocs(q);
            const teamsData = [];
            querySnapshot.forEach((doc) => {
                teamsData.push({ id: doc.id, ...doc.data() });
            });
            setTeams(teamsData);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    const createTeam = async () => {
        try {
            const teamId = uuidv4(); // Generate a unique team ID
            const teamCode = uuidv4().substring(0, 8).toUpperCase(); // Generate a unique team join code
            await setDoc(doc(db, "teams", teamId), {
                name: newTeamName,
                leader: user.uid,
                members: [user.uid],
                teamCode: teamCode, // Store the join code
            });
            await fetchTeams();
            setShowCreateModal(false);
            setNewTeamName("");
        } catch (error) {
            console.error("Error creating team:", error);
        }
    };

    const joinTeam = async () => {
        try {
            const teamsRef = collection(db, "teams");
            const q = query(teamsRef, where("teamCode", "==", joinCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const teamId = docSnapshot.id;
                    // Check if the user is already a member
                    const teamData = docSnapshot.data();
                    if (teamData.members && teamData.members.includes(user.uid)) {
                        alert("You are already a member of this team.");
                        setShowJoinModal(false);
                        setJoinCode("");
                        return;
                    }
                    // Add the user to the team's member list
                    await updateDoc(doc(db, "teams", teamId), {
                        members: arrayUnion(user.uid),
                    });
                    await fetchTeams();
                    setShowJoinModal(false);
                    setJoinCode("");
                });
            } else {
                alert("Invalid team code.");
            }
        } catch (error) {
            console.error("Error joining team:", error);
            alert("Error joining team.");
        }
    };

    const leaveTeam = async (teamId) => {
        try {
            await updateDoc(doc(db, "teams", teamId), {
                members: arrayRemove(user.uid),
            });
            await fetchTeams();
        } catch (error) {
            console.error("Error leaving team:", error);
        }
    };

    const deleteTeam = async (teamId) => {
        try {
            await deleteDoc(doc(db, "teams", teamId));
            await fetchTeams();
        } catch (error) {
            console.error("Error deleting team:", error);
        }
    };

    const goToMemberProfile = (memberId) => {
        router.push(`/profile?userId=${memberId}`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex">
            {user && <Sidebar user={user} />}
            <div className="ml-64 w-full">
                <h1 className="text-3xl font-bold mb-6">My Teams</h1>

                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Create Team
                    </button>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Join Team
                    </button>
                </div>

                <ul>
                    {teams.map((team) => (
                        <li
                            key={team.id}
                            className="bg-gray-800 p-4 rounded mb-2 flex items-center justify-between"
                        >
                            <div>
                                <h2 className="text-xl font-semibold">{team.name}</h2>
                                <p className="text-gray-400">
                                    Team Code: {team.teamCode}
                                </p>
                                <p className="text-gray-400">
                                    Members: {team.members.length}
                                </p>
                                <div className="mt-2">
                                    <h3 className="text-lg font-semibold">Team Members:</h3>
                                    <ul className="flex flex-wrap">
                                        {team.members.map((memberId) => (
                                            <li key={memberId} className="mr-2">
                                                {/* Link to the profile page */}
                                                <button
                                                    onClick={() => goToMemberProfile(memberId)}
                                                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-2 rounded"
                                                >
                                                    {memberId === user.uid ? "Me" : memberId}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="space-x-2">
                                <button
                                    onClick={() => leaveTeam(team.id)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded"
                                >
                                    Leave
                                </button>
                                {team.leader === user.uid && (
                                    <button
                                        onClick={() => deleteTeam(team.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-bold mb-4">Create Team</h2>
                            <input
                                type="text"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                placeholder="Enter team name"
                                className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                            />
                            <button
                                onClick={createTeam}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ml-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showJoinModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-bold mb-4">Join Team</h2>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter team code"
                                className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                            />
                            <button
                                onClick={joinTeam}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                            >
                                Join
                            </button>
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ml-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
