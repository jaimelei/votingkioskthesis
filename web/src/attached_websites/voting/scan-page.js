import React, { useState, useEffect } from "react";
import "./voting.css";

const HARDWARE_API = process.env.REACT_APP_HARDWARE_API;
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

const ScanPage = ({ onScan, onBack }) => {
  const [scanResult, setScanResult] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [studentData, setStudentData] = useState(null); // ✅ Combined student data object
  const [buffer, setBuffer] = useState("");
  const [lines, setLines] = useState([]);

  const [socket, setSocket] = useState(null);

  // 1. Handle QR Scan
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter") {
        if (buffer.trim() !== "") {
          setLines((prevLines) => [...prevLines, buffer.trim()]);
          setBuffer("");
        }
    
        if (lines.length >= 2) {
          const fullQRText = [...lines, buffer.trim()].join("\n");
          const parsedStudent = processScannedData(fullQRText); // ✅ Get result from function
          if (parsedStudent) {
            setStudentData(parsedStudent); // ✅ Set state
            handleQRSubmission(parsedStudent); // ✅ Use it for submission
          }
          setLines([]);
        }
      } else {
        setBuffer((prev) => prev + event.key);
      }
    };
    
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [buffer, lines]);
  
  const processScannedData = (qrText) => {
    const parsed = parseQRData(qrText);
    if (!parsed) {
      console.error("Invalid QR Code format:", qrText);
      alert("Invalid QR Code format.");
      return null;
    }
    return parsed;
  };
  
  const parseQRData = (qrText) => {
    console.log("Final QR Text for Parsing:", qrText);

    const lines = qrText.replace(/\r/g, "").trim().split("\n").map(line => line.trim());

    if (lines.length < 3) {
      console.error("Invalid QR format: Not enough lines detected");
      return null;
    }

    return {
      student_id: lines[0].replace(/Student No\.*\s*:\s*/i, "").trim(),
      student_name: capitalize(lines[1].replace(/Full Name\.*\s*:\s*/i, "").trim()),
      program: capitalize(lines[2].replace(/Program\.*\s*:\s*/i, "").trim()),
    };
  };

  const capitalize = (text) => text.replace(/\b\w/g, char => char.toUpperCase());
  
  // 2. Initialize Scanner + Send Verify Command
  const handleQRSubmission = async (parsedData) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: "getFingerprint",
        data: parsedData
      }));
      console.log("Sent QR data to WebSocket:", parsedData);
      
    } else {
      console.warn("WebSocket not ready. Skipping send.");
    }

    // Close scannerforms.exe before starting it again
    try {
      const closeResponse = await fetch(`${HARDWARE_API}/voting-api/close_scanner.php`, {
        headers: {"Ngrok-Skip-Browser-Warning": "true",}
      });

      if (closeResponse.ok) {
        const closeResult = await closeResponse.json();
        console.log("Scanner closed:", closeResult.message);
      } else {
        console.error("Failed to close ScannerForms.exe");
      }
    } catch (error) {
      console.error("Error closing ScannerForms.exe:", error);
    }

    // Initialize scanner and trigger fingerprint scan
    try {
      const res = await fetch(`${HARDWARE_API}/voting-api/initialize-scanner.php`, {
        headers: {"Ngrok-Skip-Browser-Warning": "true",}
      });
      const result = await res.json();
      if (result.success) {
        console.log("Scanner initialized");
        setInitialized(true);
  
        await fetch(`${HARDWARE_API}/voting-api/write-command.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ngrok-Skip-Browser-Warning": "true",
          },
          body: JSON.stringify({ command: "verify" }),
        });
  
        console.log("Sent 'verify' command to ScannerForms");
      } else {
        console.error("Failed to initialize scanner");
        setScanResult("Failed to initialize scanner.");
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setScanResult("Error initializing scanner.");
    }
  };
  
  // 3. Fingerprint Verification API
  const verifyStudent = async (fingerprintHash) => {
    if (!studentData) return;

    try {
      const response = await fetch(`${HARDWARE_API}/voting-api/verify-fingerprint.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ngrok-Skip-Browser-Warning": "true",
        },
        body: JSON.stringify({
          student_id: studentData.student_id,
          fingerprint_hash: fingerprintHash,
        }),
      });

      const data = await response.json();

      if (data.status === "verified") {
        setStudentInfo({
          name: data.student_name,
          studentId: data.student_id,
          program: data.program,
        });
        setScanResult("Verification successful!");
        onScan(data);
      } else {
        setScanResult("QR code and fingerprint do not match.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setScanResult("Error verifying student.");
    }
  };

  // 4. WebSocket Listener for Fingerprint Hash
  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "scanned") {
        console.log("Fingerprint hash received:", data.fingerprint_hash);
        verifyStudent(data.fingerprint_hash);
      }
    };

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setSocket(ws);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, []);

  return (
    <div className="scan-container">
      <div className="scan-content">
        <img
          src={studentData ? "/images/fingerprint.jpg" : "/images/id.jpg"}
          alt="Fingerprint"
          className="fingerprint-img"
        />
        <p className="scan-text">
          {!studentData
            ? "Scan QR code to begin"
            : initialized
            ? "Please scan your right thumb to proceed"
            : "Initializing scanner..."}
        </p>
      </div>

      {studentData && (
        <p className="scan-result">Student ID from QR: <strong>{studentData.student_id}</strong></p>
      )}

      {scanResult && <p className="scan-result">{scanResult}</p>}

      {studentInfo && (
        <ScanPopup
          studentName={studentInfo.name}
          studentId={studentInfo.studentId}
          program={studentInfo.program}
          onNext={() => {
            onScan(studentInfo);
            onBack();
          }}
        />
      )}
    </div>
  );
};

const ScanPopup = ({ studentName, studentId, program, onNext }) => (
  <div className="popup">
    <div className="popup-content">
      <h2>Information Scanned</h2>
      <div className="popup-info left-aligned">
        <p><strong>Name:</strong> {studentName}</p>
        <p><strong>Student ID:</strong> {studentId}</p>
        <p><strong>Course:</strong> {program}</p>
      </div>
      <button className="next-button center-button" onClick={onNext}>
        Next
      </button>
    </div>
  </div>
);

export default ScanPage;