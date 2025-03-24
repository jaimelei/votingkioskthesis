import React, { useState, useEffect } from "react";
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
                          <button className="edit-button" onClick={handleEditClick}>Edit</button>
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
                            <button type="submit">Update Password</button>
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