import React, { useState } from "react";
import "../styles/edit-candidate-modal.css";
import fetchWithAuth from "../utils/fetch-with-auth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9000";

function EditCandidateCredentialsModal({ candidate, onClose, onSave }) {
  const [credentials, setCredentials] = useState(candidate.credentials || [""]);

  const handleCredentialChange = (index, value) => {
    const updatedCredentials = [...credentials];
    updatedCredentials[index] = value;
    setCredentials(updatedCredentials);
  };

  const handleAddCredential = () => {
    setCredentials([...credentials, ""]);
  };

  const handleRemoveCredential = (index) => {
    const updatedCredentials = credentials.filter((_, i) => i !== index);
    setCredentials(updatedCredentials);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        position_name: candidate.position_name,
        credentials,
      };

      const response = await fetchWithAuth(`${API_URL}/api/update-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update credentials");
      }

      onSave(result);
      onClose();
    } catch (error) {
      console.error("Error updating credentials:", error);
      alert(error.message || "Failed to update credentials. Please try again.");
    }
  };

  return (
    <div className="edit-candidate-overlay">
      <div className="edit-candidate-content">
        <button className="edit-candidate-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Credentials for {candidate.name}</h2>
        <form onSubmit={handleSubmit}>
          {credentials.map((cred, index) => (
            <div key={index} className="edit-candidate-form-group">
              <label>Credential {index + 1}:</label>
              <input
                type="text"
                value={cred}
                onChange={(e) => handleCredentialChange(index, e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveCredential(index)}
                className="remove-credential-button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCredential}
            className="add-credential-button"
          >
            Add Credential
          </button>
          <button type="submit" className="save-button">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditCandidateCredentialsModal;