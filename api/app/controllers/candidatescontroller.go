package controllers

import (
	"api/app/db"
	"api/app/models"
	"database/sql"
	"encoding/json"

	"github.com/revel/revel"
)

type CandidatesController struct {
	*revel.Controller
	DB *sql.DB
}

func (c *CandidatesController) SetDB() revel.Result {
	c.DB = db.DBInstance()
	return nil
}

func (c CandidatesController) GetAllCandidates() revel.Result {
	rows, err := db.DB.Query(`SELECT position_name, name, position, year_level, program, partylist, credentials, photo_url FROM candidates`)
	if err != nil {
		revel.AppLog.Error("Error fetching candidates: ", "error", err)
		return c.RenderJSON(map[string]string{"error": "Failed to fetch candidates"})
	}
	defer rows.Close()

	var candidates []models.Candidate
	for rows.Next() {
		var candidate models.Candidate
		var credentialsJSON sql.NullString

		err := rows.Scan(
			&candidate.PositionName,
			&candidate.Name,
			&candidate.Position,
			&candidate.YearLevel,
			&candidate.Program,
			&candidate.Partylist,
			&credentialsJSON,
			&candidate.PhotoURL,
		)
		if err != nil {
			revel.AppLog.Error("Error scanning candidate data: ", "error", err)
			return c.RenderJSON(map[string]string{"error": "Failed to parse candidate data"})
		}

		if credentialsJSON.Valid {
			if err := json.Unmarshal([]byte(credentialsJSON.String), &candidate.Credentials); err != nil {
				revel.AppLog.Error("Error parsing credentials JSON: ", "error", err, "raw", credentialsJSON.String)
				return c.RenderJSON(map[string]string{"error": "Failed to parse credentials JSON"})
			}
		}

		candidates = append(candidates, candidate)
	}

	return c.RenderJSON(candidates)
}
