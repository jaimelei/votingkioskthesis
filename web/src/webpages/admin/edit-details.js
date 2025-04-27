import React, { useState, useEffect } from "react";
import "../../styles/admin/edit-details.css";
import fetchWithAuth from "../../utils/fetch-with-auth";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

function EditDetails({ onClose }) {
  const createInitialCandidate = (name = "") => ({
    name,
    credentials: [""]
  });

  const [candidates, setCandidates] = useState({
    governor: [createInitialCandidate(), createInitialCandidate()],
    viceGovernor: [createInitialCandidate(), createInitialCandidate()],
    boardMembers: {
      beed: [createInitialCandidate(), createInitialCandidate()],
      bit: [createInitialCandidate(), createInitialCandidate()],
      bpedBtledBtvded: [createInitialCandidate(), createInitialCandidate()],
      bsed: [createInitialCandidate(), createInitialCandidate()],
      bsit: [createInitialCandidate(), createInitialCandidate()],
      cba: [createInitialCandidate(), createInitialCandidate()],
      coe: [createInitialCandidate(), createInitialCandidate()],
    },
  });

  const [partylists, setPartylists] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/get-all-candidates`)
      .then((res) => res.json())
      .then((data) => {
        const uniquePartylists = [...new Set(data.map((c) => c.partylist))];
        setPartylists(uniquePartylists);

        const getCandidateName = (position, partylist) => {
          const candidate = data.find(
            (c) =>
              c.position === position && c.partylist === partylist
          );
          return candidate ? candidate.name : "";
        };

        setCandidates({
          governor: [
            createInitialCandidate(getCandidateName("Governor", uniquePartylists[0])),
            createInitialCandidate(getCandidateName("Governor", uniquePartylists[1]))
          ],
          viceGovernor: [
            createInitialCandidate(getCandidateName("Vice Governor", uniquePartylists[0])),
            createInitialCandidate(getCandidateName("Vice Governor", uniquePartylists[1]))
          ],
          boardMembers: {
            beed: [
              createInitialCandidate(getCandidateName("BM (BEED)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (BEED)", uniquePartylists[1]))
            ],
            bit: [
              createInitialCandidate(getCandidateName("BM (BIT)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (BIT)", uniquePartylists[1]))
            ],
            bpedBtledBtvded: [
              createInitialCandidate(getCandidateName("BM (BPED-BTLED-BTVDED)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (BPED-BTLED-BTVDED)", uniquePartylists[1]))
            ],
            bsed: [
              createInitialCandidate(getCandidateName("BM (BSED)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (BSED)", uniquePartylists[1]))
            ],
            bsit: [
              createInitialCandidate(getCandidateName("BM (BSIT)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (BSIT)", uniquePartylists[1]))
            ],
            cba: [
              createInitialCandidate(getCandidateName("BM (CBA)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (CBA)", uniquePartylists[1]))
            ],
            coe: [
              createInitialCandidate(getCandidateName("BM (COE)", uniquePartylists[0])),
              createInitialCandidate(getCandidateName("BM (COE)", uniquePartylists[1]))
            ],
          },
        });
      })
      .catch((err) => console.error("Failed to fetch candidates:", err));
  }, []);

  const handleCredentialChange = (position, index, credentialIndex, value, subPosition = null) => {
    const updatedCandidates = { ...candidates };

    if (subPosition) {
      updatedCandidates.boardMembers[subPosition][index].credentials[credentialIndex] = value;
    } else {
      updatedCandidates[position][index].credentials[credentialIndex] = value;
    }

    setCandidates(updatedCandidates);
  };

  const handleAddCredential = (position, index, subPosition = null) => {
    const updatedCandidates = { ...candidates };

    if (subPosition) {
      updatedCandidates.boardMembers[subPosition][index].credentials.push("");
    } else {
      updatedCandidates[position][index].credentials.push("");
    }

    setCandidates(updatedCandidates);
  };

  const renderCandidateCard = (position, candidate, index, subPosition = null) => (
    <div key={index} className="candidate-card">
      <h4>{candidate.name || `Candidate ${index + 1}`}</h4>
      <div className="credentials-section">
        <h4>Candidate Credentials</h4>
        {candidate.credentials.map((cred, credIndex) => (
          <input
            key={credIndex}
            type="text"
            placeholder={`Credential ${credIndex + 1}`}
            value={cred}
            onChange={(e) =>
              handleCredentialChange(position, index, credIndex, e.target.value, subPosition)
            }
            className="input-field credential-input"
          />
        ))}
        <button
          className="add-credential-button"
          onClick={() => handleAddCredential(position, index, subPosition)}
        >
          + Add Credential
        </button>
      </div>
    </div>
  );

  const renderPositionSection = (title, position) => (
    <>
      <h2 className="section-title">{title}</h2>
      <div className="candidates-section side-by-side-layout">
        <div className="party-column">{renderCandidateCard(position, candidates[position][0], 0)}</div>
        <div className="party-column">{renderCandidateCard(position, candidates[position][1], 1)}</div>
      </div>
    </>
  );

  const renderBoardMemberSection = (title, key) => (
    <>
      <h2 className="section-title">{title}</h2>
      <div className="candidates-section side-by-side-layout">
        <div className="party-column">
          {renderCandidateCard("boardMembers", candidates.boardMembers[key][0], 0, key)}
        </div>
        <div className="party-column">
          {renderCandidateCard("boardMembers", candidates.boardMembers[key][1], 1, key)}
        </div>
      </div>
    </>
  );

  const handleSave = async () => {
    const allCandidates = [];

    const addCandidateToList = (position, candidatesList, isBoardMember = false) => {
        candidatesList.forEach((candidate, index) => {
            if (candidate.name.trim() === "") return; // Skip if no candidate for that slot

            if (candidate.credentials.some(cred => cred.trim() === "")) {
                alert(`Please fill out atleast one credential for all positions.`);
                throw new Error("Validation failed");
            }

            allCandidates.push({
                position_name: position + "_" + candidate.name,
                credentials: candidate.credentials,
            });
        });
    };

    try {
        // Collect all candidates
        addCandidateToList("Governor", candidates.governor);
        addCandidateToList("Vice Governor", candidates.viceGovernor);

        const boardMemberPositions = {
            beed: "BM (BEED)",
            bit: "BM (BIT)",
            bpedBtledBtvded: "BM (BPED-BTLED-BTVDED)",
            bsed: "BM (BSED)",
            bsit: "BM (BSIT)",
            cba: "BM (CBA)",
            coe: "BM (COE)",
        };

        Object.entries(candidates.boardMembers).forEach(([key, value]) => {
            addCandidateToList(boardMemberPositions[key], value, true);
        });

        console.log("Final payload:", allCandidates);

        const response = await fetchWithAuth(`${API_URL}/api/post-credentials`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(allCandidates),
        });

        if (!response) {
          return;
        }
  
        if (response.ok) {
          alert("Candidates preview has been successfully updated.");
          onClose();
        } else {
          const errorData = await response.json();
          alert(`Failed to update candidates: ${errorData}`);
        }
    } catch (error) {
        console.error("Error saving candidates:", error.message);
    }
};


  return (
    <div className="details-style">
      <div className="card-container">
        <div className="card">
          <button className="close-details-button" onClick={onClose}>
            &times;
          </button>

          <h1 className="main-header">Partylists</h1>
          <div className="candidates-section side-by-side-layout">
            <div className="party-column">
              <h3>{partylists[0] || "Party 1"}</h3>
            </div>
            <div className="party-column">
              <h3>{partylists[1] || "Party 2"}</h3>
            </div>
          </div>

          {renderPositionSection("Governor Candidates", "governor")}
          {renderPositionSection("Vice Governor Candidates", "viceGovernor")}
          {renderBoardMemberSection("BM (BEED)", "beed")}
          {renderBoardMemberSection("BM (BIT)", "bit")}
          {renderBoardMemberSection("BM (BPED-BTLED-BTVDED)", "bpedBtledBtvded")}
          {renderBoardMemberSection("BM (BSED)", "bsed")}
          {renderBoardMemberSection("BM (BSIT)", "bsit")}
          {renderBoardMemberSection("BM (CBA)", "cba")}
          {renderBoardMemberSection("BM (COE)", "coe")}

          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditDetails;
