import React, { useState, useEffect } from 'react';

const HARDWARE_API = process.env.REACT_APP_HARDWARE_API;

const ScanPage = ({ onScan }) => {
  const [status, setStatus] = useState(null);
  const [student, setStudent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const startScan = async () => {
      try {
        const initResponse = await fetch(`${HARDWARE_API}/initialize`, {
          method: "POST",
        });
        const initResult = await initResponse.json();

        if (!initResult.success) {
          alert("Failed to initialize fingerprint scanner.");
          return;
        }

        const matchResponse = await fetch(`${HARDWARE_API}/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const result = await matchResponse.json();

        if (result.status === 'matched') {
          setStatus('matched');
          setStudent(result);
          setShowPopup(true); // Show popup instead of immediately calling onScan
        } else if (result.status === 'already_voted') {
          setStatus('already_voted');
          alert(`Student ${result.student_name} has already voted.`);
        } else {
          setStatus('not_matched');
          alert("No match found.");

        }

      } catch (error) {
        console.error("Error during fingerprint scan:", error);
        alert("Error during fingerprint scan.");
      }
    };

    startScan();
  }, []);

  return (
    <div className="scan-container">
      <h2>Scanning Fingerprint...</h2>

      {/* Show popup when matched */}
      {showPopup && student && (
        <div className="popup">
          <div className="popup-content">
            <p><strong>Name:</strong> {student.student_name}</p>
	    <p><strong>Student no:</strong> {student.student_id}</p>
            <p><strong>Program:</strong> {student.program}</p>
            <button onClick={() => onScan(student)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
