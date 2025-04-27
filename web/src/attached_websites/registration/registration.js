import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState,useEffect } from "react";
import "./registration.css"

const HARDWARE_API = process.env.REACT_APP_HARDWARE_API;
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

const QRScannerUSB = () => {
  const [scannedData, setScannedData] = useState(null);
  const [buffer, setBuffer] = useState(""); 
  const [lines, setLines] = useState([]); 
  const [showQRModal, setShowQRModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter") {
        if (buffer.trim() !== "") {
          setLines((prevLines) => [...prevLines, buffer.trim()]);
          setBuffer(""); 
        }

        if (lines.length >= 2) {
          const fullQRText = [...lines, buffer.trim()].join("\n");
          processScannedData(fullQRText);
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
    const parsedData = parseQRData(qrText);

    if (parsedData) {
      setScannedData(parsedData);
      setShowQRModal(true);
    } else {
      console.error("Invalid QR Code format:", qrText);
      alert("Invalid QR Code format.");
    }
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
      has_voted: 0, // Default 0 as voter has not voted yet
    };
  };

  const capitalize = (text) => text.replace(/\b\w/g, char => char.toUpperCase());

  const sendToDatabase = (data) => {
    if (!data || !data.student_id || !data.student_name || !data.program) {
        console.error("Error: Missing required fields", data);
        alert("Invalid data. Please scan again.");
        return;
    }

    fetch(`${HARDWARE_API}/voting-api/qr-api.php`, {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Ngrok-Skip-Browser-Warning": "true",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json()) // Parse JSON response
      .then((data) => {
          console.log("API Response:", data);
          if (data.success) {
              alert("Voter data recorded successfully!");
          } else {
              alert("Error: " + data.error);
          }
      })
      .catch((error) => {
          console.error("Error submitting data:", error);
          alert("Failed to submit data.");
      });  
  };

  return (
    <div className="registration-container">
      {!showQRModal ? (
        <div className="step-container">
          <img src="/images/id.jpg" alt="Uploaded ID" className="id-image" />
          <h2>Scan QR Code</h2>
          <input type="text" value={buffer} placeholder="Scan QR Code here..." readOnly />
        </div>
      ) : (
        <Modal onClose={() => setShowQRModal(false)}>
          <h3>Information Scanned</h3>
          <p><strong>Name:</strong> {scannedData?.student_name || "N/A"}</p>
          <p><strong>Student ID No.:</strong> {scannedData?.student_id || "N/A"}</p>
          <p><strong>Program:</strong> {scannedData?.program || "N/A"}</p>
          <button className="next-button" onClick={() => {
            sendToDatabase(scannedData);
            navigate("/registration/fingerprint");
          }}>
            Next
          </button>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ children, onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
  }, 300);
  };

  return (
    <div className={`modal ${closing ? "closing" : ""}`} onClick={handleClose}>
      <div className={`modal-content ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const Register = () => {
  return (
    <QRScannerUSB />
  );
};

const Fingerprint = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [showScanPrompt, setShowScanPrompt] = useState(false);

  const [fingerprintSaved, setFingerprintSaved] = useState(false);
  const [studentCheckComplete, setStudentCheckComplete] = useState(false);

  const [hideRegisterButton, setHideRegisterButton] = useState(false);

  const navigate = useNavigate();

  // Step 1: Initialize scanner
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        const response = await fetch(`${HARDWARE_API}/voting-api/run_fingerprint.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Ngrok-Skip-Browser-Warning": "true",
            },
            body: JSON.stringify({ action: "initialize" }),
        });
    
        const data = await response.json(); // Parse JSON response
    
        if (data.success) {
            setScannerReady(true);
        } else {
            alert("Failed to initialize scanner: " + data.message);
        }
    } catch (error) {
        console.error("Error initializing scanner:", error);
        alert("An error occurred while initializing the scanner.");
    } finally {
        setIsInitializing(false);
    }    
  };

    initializeScanner();
  }, []);

  // Step 2: Trigger scanner to register fingerprint
  const registerFingerprint = async () => {
    if (!scannerReady) {
      alert("Scanner is not ready. Please wait.");
      return;
    }

    setIsRegistering(true);
    setShowScanPrompt(true);
    setHideRegisterButton(true); // Hide the Register button

    try {
      const response = await fetch(`${HARDWARE_API}/voting-api/run_fingerprint.php`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Ngrok-Skip-Browser-Warning": "true",
          },
          body: JSON.stringify({ action: "register" }),
      });
  
      const data = await response.json(); // Parse JSON response
  
      if (!data.success) {
          alert("Fingerprint registration failed: " + data.message);
          setHideRegisterButton(false); // Allow retry
      }
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        alert("An error occurred during fingerprint registration.");
        setHideRegisterButton(false); // Allow retry
    } finally {
        setIsRegistering(false);
    } 
  };

  // Step 3: Poll for hash_saved status
  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "hash_saved") {
        setFingerprintSaved(true);
        setStudentCheckComplete(true);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => socket.close();
  }, []);

  return (
    <div className="container">
      {!studentCheckComplete ? (
        <>
          <div className="step-container">
            <img src="/images/fingerprint.jpg" alt="Fingerprint Scan" className="fingerprint-image" />
            <h2>Step 2: Register Your Fingerprint</h2>
            <p>Please place your right thumb on the scanner.</p>
          </div>

          {showScanPrompt && (
            <p className="scan-instructions">Scan your thumb 3 times for registration.</p>
          )}

          {isInitializing ? (
            <p className="scanner-status">Initializing scanner...</p>
          ) : scannerReady ? (
            !hideRegisterButton && (
              <button className="next-button" onClick={registerFingerprint} disabled={isRegistering}>
                {isRegistering ? "Registering..." : "Register"}
              </button>
            )
          ) : (
            <p className="scanner-status">Scanner initialization failed. Please refresh the page.</p>
          )}
        </>
      ) : (
        <Modal onClose={() => {}}>
          <h3>Registration Successful!</h3>
          <p>Your fingerprint has been registered and the scanner has been closed.</p>
          <button className="next-button" onClick={() => navigate("/registration/success")}>
            Next
          </button>
        </Modal>
      )}
    </div>
  );
};

const Success = () => {
  useEffect(() => {
    const closeScannerApp = async () => {
      try {
        const response = await fetch(`${HARDWARE_API}/voting-api/close_scanner.php`, {
            method: "POST",
            headers: {
                "Ngrok-Skip-Browser-Warning": "true",
            },
        });
    
        const data = await response.json(); // Parse JSON response
        console.log("Scanner closed:", data.message);
      } catch (error) {
          console.error("Error closing ScannerForms.exe:", error);
      }    
    };

    closeScannerApp();
  }, []);

  return (
    <div className="container">
      <h1>Registration Successful!</h1>
      <p>Thank you for registering.</p>
    </div>
  );
};

function Registration() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={
          <>
            <h1>Welcome to LSC Election A.Y 2025-2026</h1>
            <Link to="register" className="next-button">
              Register Now
            </Link>
          </>
        } />
        <Route path="register" element={<Register />} />
        <Route path="fingerprint" element={<Fingerprint />} />
        <Route path="success" element={<Success />} />
      </Routes>
    </div>
  );
}

export default Registration;
