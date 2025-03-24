import React, { useState, useEffect } from "react";
import "./voting.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const fetchCandidates = async () => {
  try {
    const response = await fetch(`${API_URL}/api/get-all-candidates`, {
      method: "GET",
      headers: {"Ngrok-Skip-Browser-Warning": "true",}
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error("Received data is not an array");
    }
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
};

const fetchVoterInfo = async (studentId) => {
  try {
      const response = await fetch(`${API_URL}/api/get-voter/${studentId}`, {
        method: "GET",
        headers: {"Ngrok-Skip-Browser-Warning": "true",}
      });
      
      const data = await response.json();

        if (data.error) {
            throw new Error(data.error);  // This handles "Voter not found" or other errors returned by the backend.
        }

      if (data.has_voted) {
        throw new Error("Student has already voted.");
      }

      return data;
  } catch (error) {
      throw error;
  }
};

const ElectionBanner = ({ onVote }) => (
  <div className="container">
    <div className="floating-box">
      <h1 className="voting-welcome">Welcome to LSC Election 2025-2026</h1>
      <button className="vote-button large-button" onClick={onVote}>
        Vote Now!
      </button>
    </div>
  </div>
);

const StudentIDPage = ({ onSubmit }) => {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
      e.preventDefault();
      setError(""); // clear previous errors

      try {
          const voterInfo = await fetchVoterInfo(studentId);
          onSubmit(studentId, voterInfo);
      } catch (err) {
          setError(err.message);
      }
  };

  return (
      <div className="student-id-container">
          <div className="student-id-box">
              <h2>Enter Student ID</h2>
              <form onSubmit={handleSubmit}>
                  <input
                      type="text"
                      placeholder="Student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="student-id-input"
                      required
                  />
                  <button type="submit" className="proceed-button">Proceed</button>
              </form>
              {error && <p className="error-message">{error}</p>}
          </div>
      </div>
  );
};

const ScanPage = ({ onScan }) => (
  <div className="scan-container">
    <div className="scan-content">
      <img
        src="/images/fingerprint.jpg"
        alt="Fingerprint"
        className="fingerprint-img large"
      />
      <p className="scan-text">Please scan your right thumb to proceed</p>
    </div>
    <button className="scan-button large-button bottom-right" onClick={onScan}>
      Scan Now
    </button>
  </div>
);

const ScanPopup = ({ voterInfo, onNext }) => (
  <div className="popup">
    <div className="popup-content">
      <h2>Information Scanned</h2>
      <div className="popup-info left-aligned">
        <p><strong>Name:</strong> {voterInfo.student_name}</p>
        <p><strong>Student ID:</strong> {voterInfo.student_id}</p>
        <p><strong>Program:</strong> {voterInfo.program}</p>
      </div>
      <button className="next-button center-button" onClick={onNext}>
        Next
      </button>
    </div>
  </div>
);

const VotingPage = ({ title, candidates, onVote, onBack, showControls }) => (
  <div className="governor-container">
      <h1 className="governor-title">{title}</h1>
      <div className="governor-content two-column-layout">
          {candidates.map((candidate, index) => (
              <div key={index} className={`candidate candidate-${index === 0 ? "left" : "right"}`}>
                  <img src={`/uploads/${candidate.photo_url}`} alt={candidate.name} className="candidate-img larger" />
                  <p className="candidate-name">{candidate.name}</p>
                  <button className="vote-button" onClick={() => onVote(candidate.name)}>
                      Vote
                  </button>
              </div>
          ))}
      </div>
      {showControls && (
          <div className="voting-controls">
              {onBack && (
                  <button className="previous-button large-button bottom-left" onClick={onBack}>
                      Previous
                  </button>
              )}
              <button className="abstain-button large-button bottom-right" onClick={() => onVote("Abstain")}>
                  Abstain
              </button>
          </div>
      )}
  </div>
);

const SummaryPopup = ({ selections, onCancel, onSubmit }) => (
  <div className="popup">
    <div className="popup-content">
      <h2>Voting Summary</h2>
      {selections.map((selection, index) => (
        <p key={index}>{selection.position}: {selection.name}</p>
      ))}
      <div className="popup-buttons">
        <button className="cancel-button bottom-left large-button" onClick={onCancel}>Cancel</button>
        <button className="submit-button bottom-right large-button" onClick={onSubmit}>Submit</button>
      </div>
    </div>
  </div>
);

const CompletedPage = ({ onDone }) => (
  <div className="completed-container">
    <h1>You have completely participated in this year's election.</h1>
    <button className="done-button" onClick={onDone}>Done</button>
  </div>
);

const InactivePage = () => (
  <div className="inactive-container">
    <h1>Voting is currently inactive.</h1>
  </div>
);

const getBoardMemberTitle = (program) => {
  const programMap = {
      "bachelor of science in computer engineering": "(COE)",
      "bachelor of science in industrial engineering": "(COE)",

      "bachelor of science in business administration major in financial management": "(CBA)",
      "bachelor of science in business administration major in marketing management": "(CBA)",
      "bachelor of science in entrepreneurship": "(CBA)",

      "bachelor of science in information technology": "(CICS)",

      "bachelor of industrial technology major in automotive": "(CIT)",
      "bachelor of industrial technology major in drafting and digital graphics": "(CIT)",
      "bachelor of industrial technology major in computer": "(CIT)",
      "bachelor of industrial technology major in electronics": "(CIT)",
      "bachelor of industrial technology major in electrical": "(CIT)",
      "bachelor of industrial technology major in food processing": "(CIT)",

      "bachelor of secondary education major in science": "(BSED)",
      "bachelor of secondary education major in mathematics": "(BSED)",
      "bachelor of secondary education major in social studies": "(BSED)",
      "bachelor of secondary education major in english minor in mandarin": "(BSED)",

      "bachelor of elementary education": "(BEED)",
      "bachelor of early childhood education": "(BEED)",

      "bachelor of physical education": "(BPED/BTLED/BTVDED)",
      "bachelor of technical vocational teacher education": "(BPED/BTLED/BTVDED)",
      "bachelor of technology and livelihood education major in home economics": "(BPED/BTLED/BTVDED)",
  };

  return programMap[program] || "Board Member";
};

function Voting() {
  const [page, setPage] = useState("loading");
  const [showPopup, setShowPopup] = useState(false);
  const [selections, setSelections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentID, setStudentID] = useState("");
  const [voterInfo, setVoterInfo] = useState(null);

  useEffect(() => {
    fetchCandidates().then(setCandidates).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/get-election-status`, {
      method: "GET",
      headers: {"Ngrok-Skip-Browser-Warning": "true",}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isActive) {
          setPage("home");
        } else {
          setPage("inactive");
        }
      })
      .catch(() => setPage("inactive"));
  }, []);

  const handleStudentIDSubmit = (id, info) => {
    setStudentID(id);
    setVoterInfo(info);
    setPage("scan");
  };

  const handleVote = (position, name) => {
    const updatedSelections = selections.filter(s => s.position !== position);
    updatedSelections.push({ position, name });
    setSelections(updatedSelections);

    if (position === "Governor") {
      setPage("vice-governor");
    } else if (position === "Vice Governor") {
      setPage("board-member");
    } else if (position === "Board Member") {
      setShowPopup(true);
    }
  };

  const handleSubmit = async () => {
    const governor = selections.find(s => s.position === "Governor")?.name || "";
    const viceGovernor = selections.find(s => s.position === "Vice Governor")?.name || "";
    const boardMember = selections.find(s => s.position === "Board Member")?.name || "";

    const governorVote = `Governor_${governor}`
    const viceGovernorVote = `Vice Governor_${viceGovernor}`
    const boardMemberVote = `BM ${showBM}_${boardMember}`

    const payload = {
      governor_vote: governorVote,
      vice_governor_vote: viceGovernorVote,
      board_member_vote: boardMemberVote,
      program: voterInfo.program,
      student_id: studentID
    };

    try {
      const response = await fetch(`${API_URL}/api/post-vote`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          const errorData = await response.json();
          alert(`Failed to submit votes: ${errorData.error}`);
          return;
      }

      alert('Votes successfully submitted!');
      } catch (error) {
          console.error('Error submitting votes:', error);
          alert('An error occurred while submitting votes.');
      } finally {
        setShowPopup(false);
        setPage("completed");
      }
  };

  if (isLoading) {
    return <div className="loading-container"><h2>Loading...</h2></div>;
  }

  if (page === "loading") {
    return <div className="loading-container"><h2>Loading...</h2></div>;
  }

  if (page === "inactive") {
    return <InactivePage />;
  }

  let showBM = "";
  if (voterInfo) {
      showBM = getBoardMemberTitle(voterInfo.program.toLowerCase());
  }

  return (
    <div className="app-container white-background">
      {page === "home" && <ElectionBanner onVote={() => setPage("student-id")} />}
      {page === "student-id" && <StudentIDPage onSubmit={handleStudentIDSubmit} />}
      {page === "scan" && <ScanPage onScan={() => setShowPopup(true)} />}
      {showPopup && page === "scan" && (
      <ScanPopup
        voterInfo={voterInfo}
        onNext={() => {
          setShowPopup(false);
          setPage("governor");
        }}
      />
      )}
      {page === "governor" && (
        <VotingPage
          title="Governor"
          candidates={candidates.filter(c => c.position === "Governor")}
          onVote={(name) => handleVote("Governor", name)}
          showControls={true}
        />
      )}
      {page === "vice-governor" && (
        <VotingPage
          title="Vice Governor"
          candidates={candidates.filter(c => c.position === "Vice Governor")}
          onVote={(name) => handleVote("Vice Governor", name)}
          onBack={() => setPage("governor")}
          showControls={true}
        />
      )}
      {page === "board-member" && (
        <VotingPage
          title={`Board Member ${showBM}`}
          candidates={candidates.filter(c => c.position === `BM ${showBM}`)}
          onVote={(name) => handleVote("Board Member", name)}
          onBack={() => setPage("vice-governor")}
          showControls={true}
        />
      )}
      {showPopup && page === "board-member" && <SummaryPopup selections={selections} onCancel={() => setShowPopup(false)} onSubmit={handleSubmit} />}
      {page === "completed" && <CompletedPage onDone={() => setPage("home")} />}
    </div>
  );
}

export default Voting;
