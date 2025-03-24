// EditPreview.jsx
import React, { useState, useEffect } from "react";
import "../../styles/admin/edit-preview.css";
import fetchWithAuth from "../../utils/fetch-with-auth";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

function EditPreview({ onClose }) {
  const [partylistLeft, setPartylistLeft] = useState("");
  const [partylistRight, setPartylistRight] = useState("");

  const createCandidatePair = () => [
    { photo: null, name: "", program: "", year_level: "" },
    { photo: null, name: "", program: "", year_level: "" },
  ];

  const [governorCandidates, setGovernorCandidates] = useState(createCandidatePair());
  const [viceGovernorCandidates, setViceGovernorCandidates] = useState(createCandidatePair());
  const [beedCandidates, setBeedCandidates] = useState(createCandidatePair());
  const [bpedBtledBtvdedCandidates, setBpedBtledBtvdedCandidates] = useState(createCandidatePair());
  const [bitCandidates, setBitCandidates] = useState(createCandidatePair());
  const [bsitCandidates, setBsitCandidates] = useState(createCandidatePair());
  const [bsedCandidates, setBsedCandidates] = useState(createCandidatePair());
  const [cbaCandidates, setCbaCandidates] = useState(createCandidatePair());
  const [coeCandidates, setCoeCandidates] = useState(createCandidatePair());

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/get-all-candidates`);
        if (!response.ok) throw new Error("Failed to fetch candidates");
        const data = await response.json() ?? {};
        console.log("Fetched candidates:", data);

        setPartylistLeft(data.partylistLeft ?? "");
        setPartylistRight(data.partylistRight ?? "");
        setGovernorCandidates(data.governorCandidates ?? createCandidatePair());
        setViceGovernorCandidates(data.viceGovernorCandidates ?? createCandidatePair());
        setBeedCandidates(data.beedCandidates ?? createCandidatePair());
        setBpedBtledBtvdedCandidates(data.bpedBtledBtvdedCandidates ?? createCandidatePair());
        setBitCandidates(data.bitCandidates ?? createCandidatePair());
        setBsitCandidates(data.bsitCandidates ?? createCandidatePair());
        setBsedCandidates(data.bsedCandidates ?? createCandidatePair());
        setCbaCandidates(data.cbaCandidates ?? createCandidatePair());
        setCoeCandidates(data.coeCandidates ?? createCandidatePair());
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchCandidates();
  }, []);

  const handleCandidateChange = (candidates, setCandidates, index, field, value) => {
    const updatedCandidates = [...candidates];
    updatedCandidates[index][field] = value;
    setCandidates(updatedCandidates);
  };

  const handlePhotoUpload = (candidates, setCandidates, index, file) => {
    const updatedCandidates = [...candidates];
    updatedCandidates[index].photo = file;
    setCandidates(updatedCandidates);
  };

  const assignPartylistBasedOnIndex = (candidates, position) =>
    candidates.map((candidate, index) => ({
      ...candidate,
      partylist: index === 0 ? partylistLeft : partylistRight,
      position: position,
    }));

    const handleSave = async () => {
      if (!partylistLeft.trim() || !partylistRight.trim()) {
        alert("Please fill in both partylist fields.");
        return;
      }
    
      // Validate each candidate's fields
      const allCandidates = [
        ...governorCandidates,
        ...viceGovernorCandidates,
        ...beedCandidates,
        ...bpedBtledBtvdedCandidates,
        ...bitCandidates,
        ...bsitCandidates,
        ...bsedCandidates,
        ...cbaCandidates,
        ...coeCandidates,
      ];
    
      const incompleteCandidate = allCandidates.find(
        (candidate) =>
          !candidate.name.trim() ||
          !candidate.program.trim() ||
          !candidate.year_level.trim() ||
          !candidate.photo
      );
    
      if (incompleteCandidate) {
        alert("Please complete all fields for each candidate, including photo uploads.");
        return;
      }
    
      const payload = {
        governorCandidates: assignPartylistBasedOnIndex(governorCandidates, "Governor"),
        viceGovernorCandidates: assignPartylistBasedOnIndex(viceGovernorCandidates, "Vice Governor"),
        beedCandidates: assignPartylistBasedOnIndex(beedCandidates, "BM (BEED)"),
        bpedBtledBtvdedCandidates: assignPartylistBasedOnIndex(bpedBtledBtvdedCandidates, "BM (BPED-BTLED-BTVDED)"),
        bitCandidates: assignPartylistBasedOnIndex(bitCandidates, "BM (BIT)"),
        bsitCandidates: assignPartylistBasedOnIndex(bsitCandidates, "BM (BSIT)"),
        bsedCandidates: assignPartylistBasedOnIndex(bsedCandidates, "BM (BSED)"),
        cbaCandidates: assignPartylistBasedOnIndex(cbaCandidates, "BM (CBA)"),
        coeCandidates: assignPartylistBasedOnIndex(coeCandidates, "BM (COE)"),
        partylistLeft,
        partylistRight,
      };
    
      try {
        // ✅ First API call - Candidate details (no photo)
        const response = await fetchWithAuth(`${API_URL}/api/post-candidates`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          mode: "cors",
          body: JSON.stringify(payload),
        });
    
        if (!response) {
          return;
        }

        const result = await response.json();
        if (response.ok) console.log("Save successful:", result.message);
        else {
          console.error("Save failed:", result.message);
          return; // Stop if details saving fails
        }
    
        // ✅ Second API call - Photo uploads (wrapped in try-catch)
        const uploadPhoto = async (candidate, position) => {
          const formData = new FormData();
          formData.append("photo", candidate.photo);
          formData.append("name", candidate.name);
          formData.append("position", position);
    
          try {
            const photoResponse = await fetchWithAuth(`${API_URL}/api/upload-candidate-photo`, {
              method: "POST",
              mode: "cors",
              body: formData,
            });
    
            const photoResult = await photoResponse.json();
            if (!photoResponse.ok) {
              console.error(`Photo upload failed for ${candidate.name}:`, photoResult.message);
            } else {
              console.log(`Photo uploaded for ${candidate.name}:`, photoResult.message);
            }
          } catch (photoError) {
            console.error(`Error uploading photo for ${candidate.name}:`, photoError);
          }
        };
    
        // ✅ Loop through all candidates and upload photos
        for (const [candidates, position] of [
          [governorCandidates, "Governor"],
          [viceGovernorCandidates, "Vice Governor"],
          [beedCandidates, "BM (BEED)"],
          [bpedBtledBtvdedCandidates, "BM (BPED-BTLED-BTVDED)"],
          [bitCandidates, "BM (BIT)"],
          [bsitCandidates, "BM (BSIT)"],
          [bsedCandidates, "BM (BSED)"],
          [cbaCandidates, "BM (CBA)"],
          [coeCandidates, "BM (COE)"],
        ]) {
          for (const candidate of candidates) {
            await uploadPhoto(candidate, position);
          }
        }
    
        alert("All candidates saved and photos uploaded successfully.");
      } catch (error) {
        console.error("An error occurred during save:", error);
      }
    };
    

  const renderCandidatesSection = (title, candidates, setCandidates) => (
    <>
      <h2 className="section-title">{title}</h2>
      <div className="candidates-section">
        {candidates.map((candidate, index) => (
          <div key={index} className="candidate-card">
            <h3 className="department-title">{title}</h3>
            <div className="photo-upload">
              {candidate.photo ? (
                <img
                  src={
                    candidate.photo instanceof File
                      ? URL.createObjectURL(candidate.photo)
                      : `${API_URL}/uploads/${candidate.photo}`
                  }
                  alt="Candidate"
                  className="uploaded-photo"
                />
              ) : (
                <label className="upload-label">
                  Upload Picture
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => handlePhotoUpload(candidates, setCandidates, index, e.target.files[0])}
                    className="file-input"
                  />
                </label>
              )}
            </div>
            <input
              type="text"
              placeholder="Enter name"
              value={candidate.name}
              required
              onChange={(e) => handleCandidateChange(candidates, setCandidates, index, "name", e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Enter program"
              value={candidate.program}
              required
              onChange={(e) => handleCandidateChange(candidates, setCandidates, index, "program", e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Enter year level"
              value={candidate.year_level}
              required
              onChange={(e) => handleCandidateChange(candidates, setCandidates, index, "year_level", e.target.value)}
              className="input-field"
            />
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="card-container">
      <div className="card">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2 className="section-title">Manage Partylist</h2>
        <div className="partylist-section">
          <input
            type="text"
            placeholder="Enter left partylist"
            value={partylistLeft}
            required
            onChange={(e) => setPartylistLeft(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Enter right partylist"
            value={partylistRight}
            required
            onChange={(e) => setPartylistRight(e.target.value)}
            className="input-field"
          />
        </div>

        {renderCandidatesSection("Governor Candidates", governorCandidates, setGovernorCandidates)}
        {renderCandidatesSection("Vice Governor Candidates", viceGovernorCandidates, setViceGovernorCandidates)}
        {renderCandidatesSection("BEED", beedCandidates, setBeedCandidates)}
        {renderCandidatesSection("BPED-BTLED-BTVDED", bpedBtledBtvdedCandidates, setBpedBtledBtvdedCandidates)}
        {renderCandidatesSection("BIT", bitCandidates, setBitCandidates)}
        {renderCandidatesSection("BSIT", bsitCandidates, setBsitCandidates)}
        {renderCandidatesSection("BSED", bsedCandidates, setBsedCandidates)}
        {renderCandidatesSection("CBA", cbaCandidates, setCbaCandidates)}
        {renderCandidatesSection("COE", coeCandidates, setCoeCandidates)}

        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

export default EditPreview;