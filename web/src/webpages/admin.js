import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "../styles/admin.css";
import ConfirmCard from "../components/confirm-card";
import PreviewCandidacy from "./admin/preview-candidacy";
import DetailsCandidacy from "./admin/details-candidacy";
import EditPreview from "./admin/edit-preview";
import EditDetails from "./admin/edit-details";
import fetchWithAuth from "../utils/fetch-with-auth"

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

function Admin() {
  //|||||||||||||||||||||||
  //  USE STATES SECTION
  //|||||||||||||||||||||||
  const [activeTab, setActiveTab] = useState("elections");
  const [candidacyTab, setCandidacyTab] = useState("preview");
  const [showConfirmCard, setShowConfirmCard] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showEditPreview, setShowEditPreview] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  useEffect(() => {
    fetchBackupList();
  }, []);

  const fetchBackupList = async () => {
      try {
          const response = await fetchWithAuth(`${API_URL}/api/get-backup-list`, {
            method: "GET",
            headers: {"Ngrok-Skip-Browser-Warning": "true",}
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setBackups(Array.isArray(data) ? data : []);
      } catch (error) {
          console.error("Failed to fetch backup list:", error);
          setMessage("Failed to load backup list.");
      }
  };



  //||||||||||||||||||||||||
  //  HANDLE CLICK SECTION
  //||||||||||||||||||||||||
  const handleDeleteClick = (e) => {
    setShowConfirmCard(true);
  };

  const handleSetTimeframeClick = (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      return;
    }
    setShowConfirmCard(true);
  };

  const handleChangePasswordClick = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      return;
    }
    setShowConfirmCard(true);
  };

  const handleEditClick = () => {
    if (candidacyTab === "preview") setShowEditPreview(true);
    if (candidacyTab === "details") setShowEditDetails(true);
  };

  const handleCloseCard = () => {
    setShowConfirmCard(false);
  };

  const handleCloseEditPreview = () => {
    setShowEditPreview(false);
  };

  const handleCloseEditDetails = () => {
    setShowEditDetails(false);
  };



  //|||||||||||||||||||||||||
  //  HANDLE SUBMIT SECTION
  //|||||||||||||||||||||||||
  const handleSetTimeframeSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetchWithAuth(`${API_URL}/api/post-voting-timeframe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          start_time: new Date(startTime).toLocaleString("sv-SE").replace(" ", "T").slice(0, 16),
          end_time: new Date(endTime).toLocaleString("sv-SE").replace(" ", "T").slice(0, 16),

        }),
      });

      if (!response) {
        return;
      }

      const data = await response.json();

      if (response.ok) {
        console.log("Timeframe successfully set:", data);
        alert("Voting timeframe updated successfully.");
      } else {
        console.error("Error setting timeframe:", data.error);
        alert(`Failed to set timeframe: ${data.error}`);
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("An error occurred while setting the timeframe.");
    } finally {
      setShowConfirmCard(false);
    }
  };
  

  const handleChangePasswordSubmit = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response) {
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        alert("Password changed successfully.");
        setOldPassword("");
        setNewPassword("");
      } else {
        alert(`Failed to change password: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      if (error === "Expired") {
        alert("An error occurred while changing the password.");
      }
    } finally {
      setShowConfirmCard(false);
    }
  };

  const handleDeleteSubmit = async (e) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/reset-elections`, {
        method: "DELETE",
      });

      if (!response) {
        return;
      }

      if (response.ok) {
        alert("Election data has been successfully reset.");
        setShowConfirmCard(false);
      } else {
        const errorData = await response.json();
        alert(`Reset failed: ${errorData.error || "Unknown error."}`);
      }
    } catch (error) {
      alert(`An error occurred during reset: ${error.message}`);
    } finally {
      setShowConfirmCard(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage("");

    try {
        const response = await fetchWithAuth(`${API_URL}/api/generate-backup`, {
          method: "POST",
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMessage(data.message);

        fetchBackupList(); // Refresh list after creating new backup
    } catch (error) {
        console.error("Failed to create backup:", error);
        setMessage("Failed to create backup.");
    } finally {
        setLoading(false);
    }
  };

  const handleCreateVotesTallyPDF = async () => {
    const doc = new jsPDF();

    // Use department labels from the departmentKeys
    const departmentLabels = {
      coe: "COE",
      cba: "CBA",
      cics: "CICS",
      cit: "CIT",
      coed: "COED",
    };
    const departmentKeys = Object.keys(departmentLabels);
  
    try {
      // Fetch all positions and candidates
      const candidatesResponse = await fetchWithAuth(`${API_URL}/api/get-all-candidates`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!candidatesResponse.ok) {
        throw new Error(`Failed to fetch candidates: ${candidatesResponse.statusText}`);
      }
  
      const candidatesData = await candidatesResponse.json();
  
      // Sort positions: Governor > Vice Governor > Board Members (alphabetical)
      const positions = [...new Set(candidatesData.map((c) => c.position))].sort((a, b) => {
        if (a === "governor") return -1;
        if (b === "governor") return 1;
        if (a === "vice governor") return -1;
        if (b === "vice governor") return 1;
        if (a.startsWith("BM") && b.startsWith("BM")) return a.localeCompare(b);
        if (a.startsWith("BM")) return 1;
        if (b.startsWith("BM")) return -1;
        return a.localeCompare(b);
      });
  
      let startY = 10; // Initial Y position for the first table
  
      // Add the title at the top of the PDF
      doc.setFontSize(16);
      doc.text("Local Student Council Elections A.Y. 2025-2026", doc.internal.pageSize.getWidth() / 2, startY, { align: "center" });
      startY += 10; // Add some spacing below the title
  
      for (const position of positions) {
        const positionCandidates = candidatesData.filter((c) => c.position === position);
  
        // Fetch total votes for each candidate
        const totalVotesPromises = positionCandidates.map((candidate) =>
          fetchWithAuth(`${API_URL}/api/get-total-votes/${candidate.position_name}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
            .then((res) => res.json())
            .then((data) => ({ name: candidate.name, total: data.total_votes || 0 }))
            .catch(() => ({ name: candidate.name, total: 0 }))
        );
  
        const totalVotes = await Promise.all(totalVotesPromises);
  
        // Fetch department votes for each candidate
        const departmentVotesPromises = positionCandidates.map((candidate) =>
          Promise.all(
            departmentKeys.map((dept) =>
              fetchWithAuth(`${API_URL}/api/get-department-votes/${candidate.position_name}/${dept}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              })
                .then((res) => res.json())
                .then((data) => ({ [dept]: data.total_votes || 0 }))
                .catch(() => ({ [dept]: 0 }))
            )
          ).then((results) => {
            const votes = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
            return { name: candidate.name, votes };
          })
        );
  
        const departmentVotes = await Promise.all(departmentVotesPromises);
  
        // Combine total votes and department votes
        const tableData = positionCandidates.map((candidate) => {
          const total = totalVotes.find((v) => v.name === candidate.name)?.total || 0;
          const deptVotes = departmentVotes.find((v) => v.name === candidate.name)?.votes || {};
          return [
            candidate.name,
            ...departmentKeys.map((dept) => deptVotes[dept] || 0),
            total,
          ];
        });
  
        // Add position title (centered)
        doc.setFontSize(14);
        doc.text(position.toUpperCase(), doc.internal.pageSize.getWidth() / 2, startY, { align: "center" });
  
        // Add table to the PDF
        doc.autoTable({
          head: [["Name", ...departmentKeys.map((key) => departmentLabels[key]), "Total Votes"]],
          body: tableData,
          startY: startY + 10, // Start below the title
          headStyles: { fillColor: "#525252", halign: "center" }, // Top row background color and center alignment
        });
  
        // Update startY for the next table
        startY = doc.lastAutoTable.finalY + 20; // Add some spacing between tables
      }
  
      // Save the PDF with a given file name
      doc.save("Local Student Council Elections A.Y. 2025-2026.pdf");
    } catch (error) {
      console.error("Error generating votes tally PDF:", error);
      alert("Failed to generate votes tally PDF.");
    }
  };



  //||||||||||||||||||||
  //  RENDER CANDIDACY
  //||||||||||||||||||||
  const renderCandidacy = () => {
    switch (candidacyTab) {
      case "preview":
        return (
          <>
            <PreviewCandidacy />
            {showEditPreview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-[500px]">
                  <EditPreview onClose={handleCloseEditPreview} />
                </div>
              </div>
            )}
          </>
        );
      case "details":
        return (
          <>
            <DetailsCandidacy />
            {showEditDetails && (
              <EditDetails onClose={handleCloseEditDetails} />
            )}
          </>
        );
      default:
        return <p>Select a candidacy tab.</p>;
    }
  };  


  
  //|||||||||||||||||||
  //  RENDER CONTENT
  //|||||||||||||||||||
  const renderContent = () => {
    switch (activeTab) {
      case "elections":
        return (
            <div className="scrollable">
                <div className="feature">
                    <div className="feature-section">
                        <h2>
                        Voting Timeframe
                            <span className="custom-tooltip">
                            ⓘ
                                <span className="tooltip-content">
                                Set the start and end times for voting.
                                </span>
                            </span>
                        </h2>
                        <div className="timeframe-container">
                          <form className="timeframe-form" onSubmit={(e) => handleSetTimeframeClick(e)}>
                            <div className="timeframe-fields">
                              <div>
                                <label>Start Time:</label>
                                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                              </div>
                              <div>
                                <label>End Time:</label>
                                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                              </div>
                            </div>
                            <button type="submit">Set Timeframe</button>
                          </form>
                          {showConfirmCard && (
                            <ConfirmCard
                                heading="Confirmation"
                                body="The dates you entered will set the beginning and end of the voting period, do you want to confirm?"
                                onClose={handleCloseCard}
                                onConfirm={handleSetTimeframeSubmit}
                            />
                          )}
                        </div>
                    </div>
                </div> 
                <div className="feature">
                    <div className="feature-section">
                        <h2>
                        Manage Candidacy
                        <span className="custom-tooltip">
                            ⓘ
                                <span className="tooltip-content">
                                Setup the different parties, positions, and their respective candidates.
                                </span>
                            </span>
                        </h2>

                        <div className="tabs">
                          <div>
                            <button
                              className={`tab-button ${candidacyTab === "preview" ? "active" : "tab-1"}`}
                              onClick={() => setCandidacyTab("preview")}
                            >
                              Preview
                            </button>
                            <button
                              className={`tab-button ${candidacyTab === "details" ? "active" : "tab-2"}`}
                              onClick={() => setCandidacyTab("details")}
                            >
                              Details
                            </button>
                          </div>
                          <div className="edit-button-container">
                          <button className="edit-button" onClick={handleEditClick}>Add Candidates</button>
                          </div>
                        </div>
                        <div className="candidacy-content">{renderCandidacy()}</div>
                    </div>
                </div>
            </div>
        );
        case "backup":
          return (
            <div>
                <div className="feature">
                    <div className="feature-section">
                        <h2>
                            Backup Data
                            <span className="custom-tooltip">
                                ⓘ
                                <span className="tooltip-content">
                                    Saves a copy of the current election data.
                                </span>
                            </span>
                        </h2>
                        <div className="button-row">
                          <button onClick={handleCreateBackup} className="backup-button" disabled={loading}>
                            {loading ? "Creating Backup..." : "Create Backup"}
                          </button>
                        </div>
                    </div>
                </div>
                <div className="feature">
                    <div className="feature-section">
                        <h2>
                            Backup List
                            <span className="custom-tooltip">
                                ⓘ
                                <span className="tooltip-content">
                                    Download previous elections data as an excel file.
                                </span>
                            </span>
                        </h2>
                        {backups.length === 0 ? (
                            <p>No backups found.</p>
                        ) : (
                            <ul>
                                {backups.map((backup) => (
                                    <li key={backup.filename}>
                                        {backup.filename} -{" "}
                                        <a
                                            href={`${API_URL}${backup.downloadUrl}`}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* New Votes Tally Section */}
                <div className="feature">
                  <div className="feature-section">
                    <h2>
                      Votes Tally
                      <span className="custom-tooltip">
                        ⓘ
                        <span className="tooltip-content">
                          Saves a copy of the current vote tally.
                        </span>
                      </span>
                    </h2>
                    <div className="button-row">
                      <button onClick={handleCreateVotesTallyPDF} className="backup-button">
                        Create PDF
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          );      
      case "access":
        return (
            <div>
                <div className="feature">
                    <div className="feature-section">
                        <h2>
                        Change Password
                        <span className="custom-tooltip">
                            ⓘ
                                <span className="tooltip-content">
                                Change the password for admin account.
                                </span>
                            </span>
                        </h2>
                        <div className="password-container">
                          <form className="timeframe-form" onSubmit={(e) => handleChangePasswordClick(e)}>
                            <div className="timeframe-fields">
                              <div>
                                <label>Old Password:</label>
                                <input type="form" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                              </div>
                              <div>
                                <label>New Password:</label>
                                <input type="form" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                              </div>
                            </div>
                            <button type="update-button">Update Password</button>
                          </form>
                          {showConfirmCard && (
                            <ConfirmCard
                                heading="Confirmation"
                                body="The dates you entered will set the beginning and end of the voting period, do you want to confirm?"
                                onClose={handleCloseCard}
                                onConfirm={handleChangePasswordSubmit}
                            />
                          )}
                        </div>
                    </div>
                </div> 
            </div>
        );
      case "reset":
        return (
            <div className="feature">
                <div className="feature-section">
                    <h2>
                    Delete Election Data
                    <span className="custom-tooltip">
                    ⓘ
                        <span className="tooltip-content">
                        Removes all data.
                        </span>
                    </span>
                    </h2>
                </div>
                <div className="button-row">
                    <button className="delete-button" onClick={handleDeleteClick}>
                    Delete
                    </button>
                </div>
                {showConfirmCard && (
                    <ConfirmCard
                        heading="Warning!"
                        body="Election data will all be deleted. This includes: parties, positions, candidates, and voting timeframe. Make sure to backup the data if necessary."
                        onClose={handleCloseCard}
                        onConfirm={handleDeleteSubmit}
                    />
                )}
            </div>
        );
      default:
        return <p>Select a tab to view content.</p>;
    }
  };



  //|||||||||||
  //  RETURN
  //|||||||||||
  return (
    <div className="admin-page">
      <aside className="sidebar">
        <h1>Dashboard</h1>
        <nav>
          <ul>
            <li
              className={activeTab === "elections" ? "active" : ""}
              onClick={() => setActiveTab("elections")}
            >
              Elections
            </li>
            <li
              className={activeTab === "backup" ? "active" : ""}
              onClick={() => setActiveTab("backup")}
            >
              Backup & Download
            </li>
            <li
              className={activeTab === "access" ? "active" : ""}
              onClick={() => setActiveTab("access")}
            >
              Access Control
            </li>
            <li
              className={activeTab === "reset" ? "active" : ""}
              onClick={() => setActiveTab("reset")}
            >
              Reset
            </li>
          </ul>
        </nav>
      </aside>
      <main className="content">{renderContent()}</main>
    </div>
  );
}

export default Admin;