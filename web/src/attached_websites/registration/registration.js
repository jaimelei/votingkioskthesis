import { BrowserRouter as Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import "./registration.css"

const Modal = ({ children, onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300); // Wait for animation to finish
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
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <div className="container">
      {!showQRModal && (
        <>
          <div className="step-container">
            <img src="/images/i.d.jpg" alt="Uploaded ID" className="id-image" />
            <h2>Step 1. Scan the QR Code of Your I.D</h2>
          </div>
          <button className="next-button" onClick={() => setShowQRModal(true)}>
            Scan Here
          </button>
        </>
      )}
      {showQRModal && (
        <Modal onClose={() => setShowQRModal(false)}>
          <h3>Information Scanned</h3>
          <p><strong>Name:</strong> John Doe</p>
          <p><strong>Student ID No.:</strong> 123456789</p>
          <p><strong>Course:</strong> Computer Science</p>
          <Link to="../fingerprint" className="next-button">Next</Link>
        </Modal>
      )}
    </div>
  );
};

const Fingerprint = () => {
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  return (
    <div className="container">
      {!showFingerprintModal && (
        <>
          <div className="step-container">
            <img src="/images/fingerprint.jpg" alt="Fingerprint Scan" className="fingerprint-image" />
            <div>
              <h2>Step 2. Register Your Fingerprint</h2>
              <p>Please put your right thumb.</p>
            </div>
          </div>
          <button className="next-button" onClick={() => setShowFingerprintModal(true)}>
            Scan Fingerprint
          </button>
        </>
      )}
      {showFingerprintModal && (
        <Modal onClose={() => setShowFingerprintModal(false)}>
          <h3>Biometric Successfully Scanned!</h3>
          <Link to="../success" className="next-button">Next</Link>
        </Modal>
      )}
    </div>
  );
};

const Success = () => {
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
