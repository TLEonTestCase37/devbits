"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/sidebar";

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchHandle, setSearchHandle] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    const friendsDoc = await getDoc(doc(db, "friends", user.uid));
    if (friendsDoc.exists()) {
      setFriends(friendsDoc.data().friendList || []);
    } else {
      await setDoc(doc(db, "friends", user.uid), { friendList: [] });
    }
  };

  const searchUser = async () => {
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.info?handles=${searchHandle}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setSearchResult(data.result[0]);
      } else {
        setSearchResult(null);
        alert("User not found");
      }
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Error searching user");
    }
  };

  const addFriend = async () => {
    if (searchResult) {
      await updateDoc(doc(db, "friends", user.uid), {
        friendList: arrayUnion(searchResult.handle),
      });
      setFriends([...friends, searchResult.handle]);
      setShowModal(false);
      setSearchHandle("");
      setSearchResult(null);
    }
  };

  const removeFriend = async (friendHandle) => {
    try {
      await updateDoc(doc(db, "friends", user.uid), {
        friendList: arrayRemove(friendHandle),
      });
      setFriends(friends.filter(friend => friend !== friendHandle));
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Error removing friend");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {user && <Sidebar user={user} />}
      <h1 className="text-3xl font-bold mb-6">My Friends</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Add Friend
      </button>

      <ul className="space-y-2">
        {friends.map((friend, index) => (
          <li key={index} className="bg-gray-800 p-2 rounded flex justify-between items-center">
            <span>{friend}</span>
            <button
              onClick={() => removeFriend(friend)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Add Friend</h2>
            <input
              type="text"
              value={searchHandle}
              onChange={(e) => setSearchHandle(e.target.value)}
              placeholder="Enter Codeforces handle"
              className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
            />
            <button
              onClick={searchUser}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2"
            >
              Search
            </button>
            {searchResult && (
              <div className="mt-4">
                <p>{searchResult.handle}</p>
                <button
                  onClick={addFriend}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded mt-2"
                >
                  Add as Friend
                </button>
              </div>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
