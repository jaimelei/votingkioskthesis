// EditCandidateModal.jsx
import React, { useState } from "react";
import "../styles/edit-candidate-modal.css";
import fetchWithAuth from "../utils/fetch-with-auth";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

function EditCandidateModal({ candidate, position, partylist, onClose, onSave }) {
  const [originalName] = useState(candidate.name);
  const [editedCandidate, setEditedCandidate] = useState({
    ...candidate,
    position,
    partylist
  });
  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedCandidate(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    setPhotoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare payload matching backend expectations
      const payload = {
        position_name: candidate.position_name, // Use original for lookup
        name: editedCandidate.name,
        position: position,
        year_level: editedCandidate.year_level,
        program: editedCandidate.program,
        partylist: partylist
      };

      console.log("Update payload:", payload);
  
      const response = await fetchWithAuth(`${API_URL}/api/update-candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      const result = await response.json(); // Don't forget to parse the response
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to update candidate");
      }
  
      // Then upload photo if a new one was selected
      if (photoFile) {
        const formData = new FormData();
        formData.append("position_name", candidate.position_name,);
        formData.append("photo", photoFile);
  
        const photoResponse = await fetchWithAuth(`${API_URL}/api/upload-candidate-photo`, {
          method: "POST",
          body: formData
        });
  
        if (!photoResponse.ok) {
          const photoResult = await photoResponse.json();
          throw new Error(photoResult.error || "Failed to upload photo");
        }
      }
  
      // Refresh data and close modal
      onSave(result); // Pass the result to parent
      onClose();
    } catch (error) {
      console.error("Error updating candidate:", error);
      alert(error.message || "Failed to update candidate. Please try again.");
    }
  };

  return (
    <div className="edit-candidate-overlay">
      <div className="edit-candidate-content">
        <button className="edit-candidate-close-button" onClick={onClose}>&times;</button>
        <h2>Edit {position} Candidate</h2>
        <form onSubmit={handleSubmit}>
          <div className="edit-candidate-form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={editedCandidate.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-candidate-form-group">
            <label>Program:</label>
            <input
              type="text"
              name="program"
              value={editedCandidate.program}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-candidate-form-group">
            <label>Year Level:</label>
            <input
              type="text"
              name="year_level"
              value={editedCandidate.year_level}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-candidate-form-group">
            <label>Photo:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            {editedCandidate.photo && !photoFile && (
              <img 
                src={`${API_URL}/uploads/${editedCandidate.photo}`} 
                alt="Current" 
                className="current-photo"
              />
            )}
          </div>
          <button type="submit" className="save-button">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditCandidateModal;