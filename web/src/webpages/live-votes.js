import { useState, useEffect } from "react";
import "../styles/live-votes.css";
import { Bar, Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9000";
const HARDWARE_API = process.env.REACT_APP_HARDWARE_API;

const departmentLabels = {
  coe: "COE",
  cba: "CBA",
  cics: "CICS",
  cit: "CIT",
  coed: "COED",
};

const departmentKeys = Object.keys(departmentLabels);

const LiveVotes = () => {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [viewMode, setViewMode] = useState("totalVotes");
  const [departmentVotes, setDepartmentVotes] = useState({});
  const [totalVotes, setTotalVotes] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [showPopup, setShowPopup] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);

  // Detect screen size and update state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/get-all-candidates`, {
      method: "GET",
      headers: {"Ngrok-Skip-Browser-Warning": "true",}
    })
      .then((res) => res.json())
      .then((data) => {
        const uniquePositions = [...new Set(data.map((c) => c.position))];
        setPositions(uniquePositions);
        setActiveTab(uniquePositions.includes("governor") ? "governor" : uniquePositions[0] || "");
        setCandidates(data);
      })
      .catch((err) => console.error("Failed to fetch positions:", err));
  }, []);

  useEffect(() => {
    if (!activeTab) return;

    const positionCandidates = candidates.filter((c) => c.position === activeTab);
    if (positionCandidates.length < 2) return;

    const positionNames = positionCandidates.map((c) => c.position_name);

    Promise.all(
      positionNames.map((posName) =>
        fetch(`${HARDWARE_API}/voting-api/get-total-votes.php?position_name=${encodeURIComponent(posName)}`, { //changed
          method: "GET",
          headers: {"Ngrok-Skip-Browser-Warning": "true",}
        })
          .then((res) => res.json())
          .then((data) => ({ [posName]: data.total_votes || 0 }))
          .catch(() => ({ [posName]: 0 }))
      )
    ).then((results) => {
      const votes = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setTotalVotes(votes);
    });
  }, [activeTab, candidates]);

  useEffect(() => {
    if (!activeTab) return;

    const positionCandidates = candidates.filter((c) => c.position === activeTab);
    if (positionCandidates.length < 2) return;

    const positionNames = positionCandidates.map((c) => c.position_name);

    Promise.all(
      positionNames.flatMap((posName) =>
        departmentKeys.map((dept) =>
          fetch(`${HARDWARE_API}/voting-api/get-department-votes.php?position_name=${encodeURIComponent(posName)}&department=${encodeURIComponent(dept)}`, { //changed
            method: "GET",
            headers: {"Ngrok-Skip-Browser-Warning": "true",}
          })
            .then((res) => res.json())
            .then((data) => ({ [`${posName}_${dept}`]: data.total_votes || 0 }))
            .catch(() => ({ [`${posName}_${dept}`]: 0 }))
        )
      )
    ).then((results) => {
      const deptVotes = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setDepartmentVotes(deptVotes);
    });
  }, [activeTab, candidates]);

  const getVotesForCandidate = (candidate) => {
    return totalVotes[candidate.position_name] || 0;
  };

  const getDepartmentVotesForCandidate = (candidate, department) => {
    return departmentVotes[`${candidate.position_name}_${department}`] || 0;
  };

  return (
    <div className="livevotes-container">
      <aside className="livevotes-sidebar">
        <h2 className="livevotes-sidebar-title">Live Votes</h2>
        <ul className="livevotes-sidebar-menu">
          {positions
            .filter((pos) => !pos.startsWith("BM"))
            .map((pos) => (
              <li
                key={pos}
                className={`livevotes-menu-item ${activeTab === pos ? "livevotes-active-tab" : ""}`}
                onClick={() => setActiveTab(pos)}
              >
                {pos.replace("-", " ")}
              </li>
            ))}

          {/* Board Members: Dropdown (Desktop) / Popup (Mobile) */}
          {positions.some((pos) => pos.startsWith("BM")) && (
            <>
              {isMobile ? (
                <li className="livevotes-menu-item" onClick={() => setShowPopup(true)}>
                  Board Members
                </li>
              ) : (
                <li className="livevotes-menu-item">
                  <details onToggle={(e) => setIsBoardDropdownOpen(e.target.open)}>
                    <summary>Board Members</summary>
                    <ul className="livevotes-dropdown">
                      {positions
                        .filter((pos) => pos.startsWith("BM"))
                        .map((pos) => (
                          <li
                            key={pos}
                            className={`livevotes-menu-item ${activeTab === pos ? "livevotes-active-tab" : ""}`}
                            onClick={() => setActiveTab(pos)}
                          >
                            {pos.replace("-", " ")}
                          </li>
                        ))}
                    </ul>
                  </details>
                </li>
              )}
            </>
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
                  className={`candidates-menu-item ${activeTab === bm ? "livevotes-active-tab" : ""}`}
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

      <main className="livevotes-content">
        <h1 className="livevotes-content-title">{activeTab.replace("-", " ")} - Live Votes</h1>

        <div className="view-toggle-buttons">
          <button className={viewMode === "totalVotes" ? "active-view" : ""} onClick={() => setViewMode("totalVotes")}>
            Total Votes
          </button>
          <button className={viewMode === "breakdown" ? "active-view" : ""} onClick={() => setViewMode("breakdown")}>
            Breakdown
          </button>
          <button
            className={viewMode === "departmentComparison" ? "active-view" : ""}
            onClick={() => setViewMode("departmentComparison")}
          >
            Department Comparison
          </button>
        </div>

        <div className="graph-container">
        {viewMode === "totalVotes" && (
        <Bar
          className="bar-graph"
          data={{
            labels: candidates.filter((c) => c.position === activeTab).map((c) => c.name),
            datasets: [
              {
                label: "",
                data: candidates
                  .filter((c) => c.position === activeTab)
                  .map((c) => getVotesForCandidate(c)),
                backgroundColor: ["#F2DD6C", "#4CAF50"],
                borderColor: "#000",
                borderWidth: 1,
              },
            ],
          }}
          options={{
            plugins: {
              legend: { display: false },
            },
          }}
        />
      )}

{viewMode === "breakdown" && (
        <div className="pie-charts">
          {candidates
            .filter((c) => c.position === activeTab)
            .map((c) => (
              <div key={c.position_name} className="pie-chart-container">
                <Pie
                  className="pie-chart"
                  data={{
                    labels: departmentKeys.map((dept) => departmentLabels[dept]),
                    datasets: [
                      {
                        data: departmentKeys.map(
                          (dept) => getDepartmentVotesForCandidate(c, dept)
                        ),
                        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"],
                        borderColor: "#000",
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
                <p className="candidate-name">{c.name}</p>
              </div>
            ))}
        </div>
      )}

{viewMode === "departmentComparison" && (
    <Bar
      className="bar-graphs"
      data={{
        labels: departmentKeys.map((dept) => departmentLabels[dept]),
        datasets: candidates
          .filter((c) => c.position === activeTab)
          .map((c, index) => ({
            label: c.name,
            data: departmentKeys.map(
              (dept) => getDepartmentVotesForCandidate(c, dept)
            ),
            backgroundColor: index % 2 === 0 ? "#F2DD6C" : "#4CAF50",
            borderColor: "#000",
            borderWidth: 1,
          })),
      }}
    />
  )}
        </div>
      </main>
    </div>
  );
};

export default LiveVotes;
