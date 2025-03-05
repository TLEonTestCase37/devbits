"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CFVerification = () => {
  const [cfId, setCfId] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingCfId, setExistingCfId] = useState(null);

  useEffect(() => {
    const fetchUserCFID = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setExistingCfId(userSnap.data().cfId);
        }
      }
    };
    fetchUserCFID();
  }, []);

  const checkCFSubmission = async () => {
    if (!cfId) return alert("Please enter your Codeforces ID");
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.status?handle=${cfId}&from=1&count=5`
      );
      const data = await response.json();
      
      if (data.status !== "OK") {
        throw new Error("Failed to fetch submissions");
      }

      const wrongSubmission = data.result.find(
        (sub) => sub.problem.contestId === 1800 && sub.problem.index === "A" && sub.verdict === "WRONG_ANSWER"
      );

      if (wrongSubmission) {
        setVerified(true);
        saveCFID(cfId);
      } else {
        alert("No wrong submission found on 1800A. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Error verifying submission");
    }

    setLoading(false);
  };

  const saveCFID = async (cfId) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { cfId }, { merge: true });
    setExistingCfId(cfId);
  };

  return (
    <div>
      <h2>Link Your Codeforces ID</h2>
      {existingCfId ? (
        <p>Your verified CF ID: <strong>{existingCfId}</strong></p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter your Codeforces ID"
            value={cfId}
            onChange={(e) => setCfId(e.target.value)}
          />
          <button onClick={checkCFSubmission} disabled={loading}>
            {loading ? "Verifying..." : "Verify CF ID"}
          </button>
          {verified && <p>✅ Verification successful!</p>}
        </>
      )}
    </div>
  );
};

export default CFVerification;
