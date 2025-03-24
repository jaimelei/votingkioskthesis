package controllers

import (
	"api/app/db"
	"database/sql"
	"fmt"
	"net/http"

	"api/app/models"

	"github.com/revel/revel"
)

type VotingController struct {
	*revel.Controller
	DB *sql.DB
}

func (c *VotingController) SetDB() revel.Result {
	c.DB = db.DBInstance()
	return nil
}

func (c *VotingController) GetElectionStatus() revel.Result {
	var isActive bool
	err := c.DB.QueryRow("SELECT is_active FROM election_settings LIMIT 1").Scan(&isActive)
	if err != nil {
		return c.RenderJSON(map[string]interface{}{
			"success": false,
			"error":   "Failed to fetch election status",
		})
	}
	return c.RenderJSON(map[string]interface{}{
		"success":  true,
		"isActive": isActive,
	})
}

func (c VotingController) GetVoter(student_id string) revel.Result {
	row := c.DB.QueryRow(`SELECT fingerprint_hash, student_id, student_name, program, has_voted FROM voters WHERE student_id = ?`, student_id)

	var voter models.Voter

	err := row.Scan(
		&voter.FingerprintHash,
		&voter.StudentID,
		&voter.StudentName,
		&voter.Program,
		&voter.HasVoted,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.RenderJSON(map[string]string{"error": "ID not found. Student is not registered."})
		}
		revel.AppLog.Error("Error fetching voter data: ", "error", err)
		return c.RenderJSON(map[string]string{"error": "Failed to fetch voter data"})
	}

	return c.RenderJSON(voter)
}

func (c *VotingController) PostVote() revel.Result {
	var request models.Votes
	if err := c.Params.BindJSON(&request); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request body"})
	}

	department, err := db.IdentifyDepartment(request.Program)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Invalid program specified"})
	}

	votes := []string{request.GovernorVote, request.ViceGovernorVote, request.BoardMemberVote}
	for _, vote := range votes {
		query := fmt.Sprintf(`
			INSERT INTO votes (position_name, %s)
			VALUES (?, 1)
			ON DUPLICATE KEY UPDATE %s = %s + 1
			`, department, department, department)

		_, err := c.DB.Exec(query, vote)
		if err != nil {
			return c.RenderJSON(map[string]string{"error": "Failed to update votes for " + vote})
		}
	}

	query := `UPDATE voters SET has_voted = TRUE WHERE student_id = ?`
	_, err = c.DB.Exec(query, request.StudentID)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Failed to update voting status"})
	}

	return c.RenderJSON(map[string]string{"success": "Votes has been added"})
}
