import React, { useEffect, useState } from "react";
import "../../styles/admin/details-candidacy.css";
import EditCandidateCredentialsModal from "../../components/edit-candidate-credentials-modal";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9000";

const DetailsCandidacy = () => {
  const [candidates, setCandidates] = useState([]);
  const [partylists, setPartylists] = useState([]);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/get-all-candidates`, {
      method: "GET",
      headers: { "Ngrok-Skip-Browser-Warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);

        const uniquePartylists = [...new Set(data.map((c) => c.partylist))];
        setPartylists(uniquePartylists);
      })
      .catch((err) => console.error("Failed to fetch candidates:", err));
  }, []);

  const getCandidate = (position, partylist) => {
    return candidates.find(
      (c) => c.position === position && c.partylist === partylist
    );
  };

  const handleEditClick = (position, partylist) => {
    const candidate = getCandidate(position, partylist);
    setEditingCandidate(candidate || { position, partylist, credentials: [] });
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    // Refresh candidates after successful edit
    fetch(`${API_URL}/api/get-all-candidates`, {
      method: "GET",
      headers: { "Ngrok-Skip-Browser-Warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);
      })
      .catch((err) => console.error("Failed to fetch candidates:", err));
  };

  const renderCandidateInfo = (candidate, position, partylist) => {
    return (
      <div className="candidate-credentials-container">
        {candidate ? (
          <div className="info-edit-flex">
            <div className="candidate-credentials-details">
              Name: {candidate.name}
              <br />
              Credentials:{" "}
              {candidate.credentials.length > 0 ? (
                <ul className="candidate-credentials">
                  {candidate.credentials.map((cred, index) => (
                    <li key={index}>{cred}</li>
                  ))}
                </ul>
              ) : (
                "-"
              )}
            </div>
            <button
              className="indiv-edit-button"
              onClick={() => handleEditClick(position, partylist)}
            >
              ✏️ Edit
            </button>
          </div>
        ) : (
          <div>
            <div className="candidate-details">
              Name: -<br />
              Credentials: -
            </div>
            <div>
              <button
                className="edit-button"
                onClick={() => handleEditClick(position, partylist)}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (partylists.length < 2) {
    return <p>Waiting for candidates or missing parties...</p>;
  }

  return (
    <div className="candidacy-container">
      {isModalOpen && (
        <EditCandidateCredentialsModal
          candidate={editingCandidate}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSuccess}
        />
      )}

      <div className="preview-grid">
        <div className="grid-header">Position</div>
        <div className="grid-header">{partylists[0]}</div>
        <div className="grid-header">{partylists[1]}</div>

        {/* Governor */}
        <div className="grid-item-position">
          <h2>Governor</h2>
        </div>
        <div className="grid-item">
          {renderCandidateInfo(
            getCandidate("Governor", partylists[0]),
            "Governor",
            partylists[0]
          )}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(
            getCandidate("Governor", partylists[1]),
            "Governor",
            partylists[1]
          )}
        </div>

        {/* Vice Governor */}
        <div className="grid-item-position"><h2>Vice Governor</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("Vice Governor", partylists[0]), "Vice Governor", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("Vice Governor", partylists[1]), "Vice Governor", partylists[1])}
        </div>

        {/* Board Member (BEED) */}
        <div className="grid-item-position"><h2>BM (BEED)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BEED)", partylists[0]), "BM (BEED)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BEED)", partylists[1]), "BM (BEED)", partylists[1])}
        </div>

        {/* Board Member (BIT) */}
        <div className="grid-item-position"><h2>BM (BIT)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BIT)", partylists[0]), "BM (BIT)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BIT)", partylists[1]), "BM (BIT)", partylists[1])}
        </div>

        {/* Board Member (BPED-BTLED-BTVDED) */}
        <div className="grid-item-position"><h2>BM (BPED-BTLED-BTVDED)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BPED-BTLED-BTVDED)", partylists[0]), "BM (BPED-BTLED-BTVDED)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BPED-BTLED-BTVDED)", partylists[1]), "BM (BPED-BTLED-BTVDED)", partylists[1])}
        </div>

        {/* Board Member (BSED) */}
        <div className="grid-item-position"><h2>BM (BSED)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BSED)", partylists[0]), "BM (BSED)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BSED)", partylists[1]), "BM (BSED)", partylists[1])}
        </div>

        {/* Board Member (BSIT) */}
        <div className="grid-item-position"><h2>BM (BSIT)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BSIT)", partylists[0]), "BM (BSIT)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (BSIT)", partylists[1]), "BM (BSIT)", partylists[1])}
        </div>

        {/* Board Member (CBA) */}
        <div className="grid-item-position"><h2>BM (CBA)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (CBA)", partylists[0]), "BM (CBA)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (CBA)", partylists[1]), "BM (CBA)", partylists[1])}
        </div>

        {/* Board Member (COE) */}
        <div className="grid-item-position"><h2>BM (COE)</h2></div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (COE)", partylists[0]), "BM (COE)", partylists[0])}
        </div>
        <div className="grid-item">
          {renderCandidateInfo(getCandidate("BM (COE)", partylists[1]), "BM (COE)", partylists[1])}
        </div>
      </div>
    </div>
  );
};

export default DetailsCandidacy;
