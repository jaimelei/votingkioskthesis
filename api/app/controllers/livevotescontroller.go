package controllers

import (
	"api/app/db"
	"database/sql"

	"github.com/revel/revel"
)

type LiveVotesController struct {
	*revel.Controller
	DB *sql.DB
}

func (c *LiveVotesController) SetDB() revel.Result {
	c.DB = db.DBInstance()
	return nil
}

func (c *LiveVotesController) GetTotalVotes(position_name string) revel.Result {
	var totalVotes int
	err := c.DB.QueryRow("SELECT total_votes FROM votes WHERE position_name = ?", position_name).Scan(&totalVotes)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.RenderJSON(map[string]string{"error": "No votes found for the given position"})
		}
		revel.AppLog.Errorf("Failed to retrieve total votes for %s: %v", position_name, err)
		return c.RenderJSON(map[string]string{"error": "Failed to retrieve total votes"})
	}

	return c.RenderJSON(map[string]interface{}{
		"position_name": position_name,
		"total_votes":   totalVotes,
	})
}

func (c *LiveVotesController) GetDepartmentVotes(position_name, department string) revel.Result {
	query, err := db.GetDepartmentVoteQuery(department)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Invalid department specified"})
	}

	var departmentVotes int
	err = c.DB.QueryRow(query, position_name).Scan(&departmentVotes)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.RenderJSON(map[string]string{"error": "No votes found for the given position and department"})
		}
		revel.AppLog.Errorf("Failed to retrieve votes for position %s in department %s: %v", position_name, department, err)
		return c.RenderJSON(map[string]string{"error": "Failed to retrieve votes by department"})
	}

	return c.RenderJSON(map[string]interface{}{
		"position_name": position_name,
		"department":    department,
		"total_votes":   departmentVotes,
	})
}
