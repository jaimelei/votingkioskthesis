package controllers

import (
	"api/app/db"
	"database/sql"
	"net/http"

	"github.com/revel/revel"
)

type RegistrationController struct {
	*revel.Controller
	DB *sql.DB
}

func (c *RegistrationController) SetDB() revel.Result {
	c.DB = db.DBInstance()
	return nil
}

func (c *RegistrationController) RegisterQr() revel.Result {
	var request struct {
		StudentID   string `json:"student_id"`
		StudentName string `json:"student_name"`
		Program     string `json:"program"`
	}

	if err := c.Params.BindJSON(&request); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]interface{}{
			"success": false,
			"error":   "Invalid JSON received",
		})
	}

	// Check required fields
	if request.StudentID == "" || request.StudentName == "" || request.Program == "" {
		return c.RenderJSON(map[string]interface{}{
			"success": false,
			"error":   "Invalid input data",
		})
	}

	// Check if student already exists
	var count int
	err := c.DB.QueryRow(`
		SELECT COUNT(*) FROM voters WHERE student_id = ?
	`, request.StudentID).Scan(&count)

	if err != nil {
		return c.RenderJSON(map[string]interface{}{
			"success": false,
			"error":   "Database error",
		})
	}

	if count > 0 {
		return c.RenderJSON(map[string]interface{}{
			"success": false,
			"error":   "Student ID already registered",
		})
	}

	// Insert new student
	_, err = c.DB.Exec(`
		INSERT INTO voters (student_name, student_id, program, has_voted)
		VALUES (?, ?, ?, 0)
	`, request.StudentName, request.StudentID, request.Program)

	if err != nil {
		return c.RenderJSON(map[string]interface{}{
			"success": false,
			"error":   "Database insert error",
		})
	}

	return c.RenderJSON(map[string]interface{}{
		"success": true,
	})
}
