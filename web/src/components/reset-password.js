import React, { useState, useEffect } from 'react';
import Modal from 'react-modal'; // Import react-modal
import '../styles/reset-password.css';

const HARDWARE_API = process.env.REACT_APP_HARDWARE_API;
// Set the app element for accessibility (required by react-modal)
Modal.setAppElement('#root');

const ResetPasswordModal = ({ showModal, setShowModal }) => {
  const [isMatched, setIsMatched] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  useEffect(() => {
  if (!showModal) {
    setIsMatched(false);
    setEnrolling(false);
    setSuccess(false); // ✅ Reset on modal close
    setPassword('');
    setConfirmPassword('');
  }
}, [showModal]);


  useEffect(() => {
  let intervalId;

  const checkAdminMatch = async () => {
    try {
      const res = await fetch(`${HARDWARE_API}/adminMatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Ngrok-Skip-Browser-Warning": "true"
        }
      });

      const data = await res.json();
      console.log('adminMatch response:', data);

      if (data?.matched === true || data?.status === "matched") {
        setIsMatched(true);
        clearInterval(intervalId); // ✅ stop checking once matched
      }
    } catch (err) {
      console.error('Error checking admin match:', err);
    }
  };

  if (showModal) {
    setIsMatched(false); // reset each time modal opens

    // ✅ check immediately, then every 2 seconds
    checkAdminMatch();
    intervalId = setInterval(checkAdminMatch, 2000);
  }

  return () => {
    // ✅ cleanup interval when modal closes or component unmounts
    clearInterval(intervalId);
  };
}, [showModal]);



  const handleSubmit = async (e) => {
  e.preventDefault();
  if (password !== confirmPassword) {
    alert("Passwords don't match");
    return;
  }

  try {
    setEnrolling(true);

    const res = await fetch(`${HARDWARE_API}/adminEnroll`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Ngrok-Skip-Browser-Warning": "true"
      },
      body: JSON.stringify({
        password: password  // ✅ Send password here
      })
    });

    const result = await res.json();
    console.log("Enroll response:", result);

    if (result?.status === 'enrolled') {
      setSuccess(true); // ✅ Show success
    }



  } catch (error) {
    console.error('Error during admin enroll:', error);
  }
};


  return (
  <Modal
    isOpen={showModal}
    onRequestClose={() => setShowModal(false)}
    className="modal-content"
    overlayClassName="modal-overlay"
  >
    <button
      className="close-button absolute top-2 right-1 text-gray-500 hover:text-gray-700"
      onClick={() => setShowModal(false)}
    >
      ✕
    </button>

    {!isMatched ? (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Admin Biometric</h2>
        <p className="text-gray-600">Waiting for admin verification...</p>
      </div>
    ) : success ? (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4 text-green-600">Password Set Successfully</h2>
        <p className="text-gray-600">You can now close this window.</p>
      </div>
    ) : enrolling ? (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Enroll New Admin Biometric</h2>
        <p className="text-gray-600">Please scan new admin fingerprint...</p>
      </div>
    ) : (
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 mb-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-2 mb-4 border rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    )}
  </Modal>
);
};

export default ResetPasswordModal;