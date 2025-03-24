import React from "react";
import "../styles/confirm-card.css";

function ConfirmCard({ heading, body, onClose, onConfirm }) {
  return (
    <div className="confirm-card-overlay">
      <div className="confirm-card">
        <h2>{heading}</h2>
        <p>{body}</p>
        <div className="card-buttons">
          <button onClick={onClose} className="confirm-card-close-button">
            Cancel
          </button>
          <button onClick={onConfirm} className="confirm-card-confirm-button">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmCard;
