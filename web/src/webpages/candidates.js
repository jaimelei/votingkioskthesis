import { useState, useEffect } from "react";
import "../styles/candidates.css";

const API_URL = process.env.REACT_APP_API_URL;

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [activeTab, setActiveTab] = useState("governor");
  const [viewMode, setViewMode] = useState("preview");
  const [showBoardDropdown, setShowBoardDropdown] = useState(false); // PC Dropdown
  const [showPopup, setShowPopup] = useState(false); // Mobile Popup
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    console.log(API_URL);
    fetch(`${API_URL}/api/get-all-candidates`, {
      method: "GET",
      headers: {"Ngrok-Skip-Browser-Warning": "true",}
    })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);
        const uniquePositions = [...new Set(data.map((c) => c.position))];
        setPositions(uniquePositions);
        if (uniquePositions.includes("governor")) {
          setActiveTab("governor");
        } else {
          const firstNonBM = uniquePositions.find((pos) => !pos.startsWith("BM"));
          setActiveTab(firstNonBM || uniquePositions[0] || "");
        }
      })
      .catch((err) => console.error("Failed to fetch candidates:", err));
  }, []);

  // Organize candidates by position
  const groupedCandidates = {};
  positions.forEach((position) => {
    groupedCandidates[position] = candidates.filter((c) => c.position === position);
  });

  // Toggle Mobile Popup
  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  return (
    <div className="candidates-container">
      {/* Sidebar */}
      <aside className="candidates-sidebar">
        <h2 className="candidates-sidebar-title">Candidates</h2>
        <ul className="candidates-sidebar-menu">
          {positions
            .filter((position) => !position.startsWith("BM"))
            .map((position) => (
              <li
                key={position}
                className={`candidates-menu-item ${activeTab === position ? "candidates-active-tab" : ""}`}
                onClick={() => setActiveTab(position)}
              >
                {position.replace("-", " ")}
              </li>
            ))}

          {/* Board Members Dropdown (PC) */}
          {positions.some((pos) => pos.startsWith("BM")) && !isMobile && (
            <li className={`${!showBoardDropdown ? "candidates-menu-item" : "dropdown-open"}`}>
              <div onClick={() => setShowBoardDropdown((prev) => !prev)} style={{ cursor: "pointer" }}>
                Board Members {showBoardDropdown ? "▲" : "▼"}
              </div>
              {showBoardDropdown && (
                <ul className="board-members-dropdown">
                  {positions
                    .filter((position) => position.startsWith("BM"))
                    .map((bm) => (
                      <li
                        key={bm}
                        className={`candidates-menu-item ${activeTab === bm ? "candidates-active-tab" : ""}`}
                        onClick={() => {
                          setActiveTab(bm);
                          setShowBoardDropdown(true);
                        }}
                      >
                        {bm.replace("-", " ")}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          )}

          {/* Board Members Popup (Mobile) */}
          {positions.some((pos) => pos.startsWith("BM")) && isMobile && (
            <li className="candidates-menu-item" onClick={togglePopup}>
              Board Members
            </li>
          )}
        </ul>
      </aside>

      {/* Mobile Popup */}
      {showPopup && isMobile && (
        <div className="popup">
          <ul className="board-members-popup">
            {positions
              .filter((position) => position.startsWith("BM"))
              .map((bm) => (
                <li
                  key={bm}
                  className={`candidates-menu-item ${activeTab === bm ? "candidates-active-tab" : ""}`}
                  onClick={() => {
                    setActiveTab(bm);
                    setShowPopup(false);
                  }}
                >
                  {bm.replace("-", " ")}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Main Content */}
      <main className="candidates-content">
        <h1 className="candidates-content-title">{activeTab.replace("-", " ")} Candidates</h1>

        {/* View Mode Toggle Buttons */}
        <div className="view-toggle-buttons">
          <button
            className={viewMode === "preview" ? "active-view" : ""}
            onClick={() => setViewMode("preview")}
          >
            Preview
          </button>
          <button
            className={viewMode === "details" ? "active-view" : ""}
            onClick={() => setViewMode("details")}
          >
            Details
          </button>
        </div>

        <div className="candidates-list">
          {groupedCandidates[activeTab]?.map((candidate, index) =>
            index % 2 === 0 ? (
              <div key={candidate.id} className="candidates-pair">
                <CandidateCard candidate={groupedCandidates[activeTab][index]} viewMode={viewMode} />
                {groupedCandidates[activeTab][index + 1] && (
                  <CandidateCard candidate={groupedCandidates[activeTab][index + 1]} viewMode={viewMode} />
                )}
              </div>
            ) : null
          )}
        </div>
      </main>
    </div>
  );
};

// Candidate Card Component
const CandidateCard = ({ candidate, viewMode }) => {
  return (
    <div className="render-candidate-card">
      <img src={`/uploads/${candidate.photo_url}`} alt={candidate.name} className="candidate-photo" />
      <h3 className="candidate-name">{candidate.name}</h3>
      <hr className="candidate-divider" />

      {viewMode === "preview" ? (
        <>
          <p className="candidate-partylist"><strong>Partylist:</strong> {candidate.partylist}</p>
          <hr className="candidate-divider" />
          <p className="candidate-program"><strong>Program:</strong> {candidate.program}</p>
          <hr className="candidate-divider" />
          <p className="candidate-year"><strong>Year:</strong> {candidate.year_level}</p>
        </>
      ) : (
        <>
          <h4 className="candidate-credentials-title">Credentials</h4>
          {candidate.credentials ? (
            <ul className="render-candidate-credentials">
              {Array.isArray(candidate.credentials)
                ? candidate.credentials.map((cred, idx) => <li key={idx}>{cred}</li>)
                : candidate.credentials.split(",").map((cred, idx) => <li key={idx}>{cred.trim()}</li>)}
            </ul>
          ) : (
            <p className="render-candidate-credentials">No credentials provided.</p>
          )}
        </>
      )}
    </div>
  );
};

export default Candidates;
