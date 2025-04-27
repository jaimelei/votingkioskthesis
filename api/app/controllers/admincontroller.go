package controllers

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"api/app/db"
	"api/app/models"

	"github.com/revel/revel"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"

	"fmt"
	"time"
)

type AdminController struct {
	*revel.Controller
	DB *sql.DB
}

func (c *AdminController) SetDB() revel.Result {
	c.DB = db.DBInstance()

	if result := c.Before(); result != nil {
		return result
	}

	return nil
}

//--------------------------------------------------------------------//

func (c *AdminController) Before() revel.Result {
	fmt.Println(">>> Before filter is running")
	tokenString := c.Request.Header.Get("Authorization")

	if tokenString == "" {
		return c.Forbidden("Missing authorization token")
	}

	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	_, err := db.ValidateJWT(tokenString)
	if err != nil {
		return c.Forbidden("Invalid or expired token")
	}

	return nil
}

func (c *AdminController) ResetElections() revel.Result {
	_, err := c.DB.Exec("SET FOREIGN_KEY_CHECKS = 0;")
	if err != nil {
		revel.AppLog.Errorf("Failed to disable foreign key checks: %v", err)
		return c.RenderJSON(map[string]string{"error": "Failed to disable foreign key checks"})
	}

	tables := []string{"votes", "candidates", "voters", "election_settings"}
	for _, table := range tables {
		_, err := c.DB.Exec("TRUNCATE TABLE " + table + ";")
		if err != nil {
			revel.AppLog.Errorf("Failed to truncate table %s: %v", table, err)
			return c.RenderJSON(map[string]string{"error": "Failed to delete data from " + table})
		}
	}

	_, err = c.DB.Exec("SET FOREIGN_KEY_CHECKS = 1;")
	if err != nil {
		revel.AppLog.Errorf("Failed to enable foreign key checks: %v", err)
		return c.RenderJSON(map[string]string{"error": "Failed to enable foreign key checks"})
	}

	uploadsFolder := filepath.Join(revel.BasePath, "..", "web", "public", "uploads")

	err = filepath.Walk(uploadsFolder, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			if removeErr := os.Remove(path); removeErr != nil {
				revel.AppLog.Errorf("Failed to delete file %s: %v", path, removeErr)
			}
		}
		return nil
	})

	if err != nil {
		revel.AppLog.Errorf("Failed to clean uploads folder: %v", err)
		return c.RenderJSON(map[string]string{"error": "Failed to clean uploads folder"})
	}

	return c.RenderJSON(map[string]string{"success": "All data deleted successfully"})
}

func (c *AdminController) PostVotingTimeframe() revel.Result {
	var request models.Timeframe
	if err := c.Params.BindJSON(&request); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request body"})
	}

	layout := "2006-01-02T15:04"
	startTime, err := time.ParseInLocation(layout, request.StartTime, time.Local)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Invalid voting_start format. Use 'YYYY-MM-DDTHH:MM'"})
	}

	endTime, err := time.ParseInLocation(layout, request.EndTime, time.Local)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Invalid voting_end format. Use 'YYYY-MM-DDTHH:MM'"})
	}

	currentTime := time.Now().In(time.Local)
	currentTime = currentTime.Truncate(time.Second)
	startTime = startTime.Truncate(time.Second)
	endTime = endTime.Truncate(time.Second)
	isActive := currentTime.After(startTime) && currentTime.Before(endTime)
	isActiveInt := 0
	if isActive {
		isActiveInt = 1
	}

	formattedStart := startTime.Format("2006-01-02 15:04:05")
	formattedEnd := endTime.Format("2006-01-02 15:04:05")

	fmt.Println("Current:", currentTime)
	fmt.Println("Start:", startTime)
	fmt.Println("End:", endTime)
	fmt.Println("isActiveInt:", isActiveInt)

	query := `INSERT INTO election_settings (id, voting_start, voting_end, is_active)
			  VALUES (1, ?, ?, ?)
			  ON DUPLICATE KEY UPDATE
			  	  voting_start = VALUES(voting_start),
				  voting_end = VALUES(voting_end),
				  is_active = VALUES(is_active);`

	_, err = c.DB.Exec(query, formattedStart, formattedEnd, isActiveInt)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Failed to set timeframe"})
	}

	db.ScheduleElectionDeactivation(c.DB, endTime)

	return c.RenderJSON(map[string]string{"message": "Voting timeframe set successfully"})
}

func (c *AdminController) ChangePassword() revel.Result {
	var request models.ChangePassword
	if err := c.Params.BindJSON(&request); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request body"})
	}

	var storedUsername, storedHash string
	err := c.DB.QueryRow("SELECT username, password_hash FROM admin LIMIT 1").Scan(&storedUsername, &storedHash)
	if err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Failed to retrieve admin credentials"})
	}

	if !db.ComparePasswords(storedHash, request.OldPassword) {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Old password is incorrect"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Failed to hash new password"})
	}

	_, err = c.DB.Exec("UPDATE admin SET password_hash = ?", hashedPassword)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Failed to update password"})
	}

	return c.RenderJSON(map[string]string{"message": "Password updated successfully"})
}

func (c *AdminController) FirstPassword() revel.Result {
	password := "admin123"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Failed to hash new password"})
	}

	_, err = c.DB.Exec("INSERT INTO admin (username, password_hash) VALUES (?, ?)", "admin", hashedPassword)
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Failed to insert admin credentials"})
	}

	return c.RenderJSON(map[string]string{"message": "Admin credentials inserted successfully"})
}

func (c *AdminController) PostCandidates() revel.Result {
	var payload models.PostCandidatesPayload
	if err := c.Params.BindJSON(&payload); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request payload"})
	}

	sections := map[string][]models.Candidate{
		"Governor":          payload.GovernorCandidates,
		"Vice Governor":     payload.ViceGovernorCandidates,
		"BEED":              payload.BeedCandidates,
		"BPED/BTLED/BTVDED": payload.BpedBtledBtvdedCandidates,
		"BIT":               payload.BitCandidates,
		"BSIT":              payload.BsitCandidates,
		"BSED":              payload.BsedCandidates,
		"CBA":               payload.CbaCandidates,
		"COE":               payload.CoeCandidates,
	}

	insertQuery := `INSERT INTO candidates 
		(position_name, name, position, year_level, program, partylist)
		VALUES (?, ?, ?, ?, ?, ?)`

	for _, candidates := range sections {
		for _, candidate := range candidates {
			positionName := candidate.Position + "_" + candidate.Name
			_, err := c.DB.Exec(insertQuery,
				positionName,
				candidate.Name,
				candidate.Position,
				candidate.YearLevel,
				candidate.Program,
				candidate.Partylist,
			)
			if err != nil {
				revel.AppLog.Errorf("Failed to save candidate %s: %v", candidate.Name, err)
				c.Response.Status = http.StatusInternalServerError
				return c.RenderJSON(map[string]string{"message": "Failed to save candidates"})
			}
		}
	}

	return c.RenderJSON(map[string]string{"message": "Candidates saved successfully"})
}

func (c *AdminController) UploadCandidatePhoto() revel.Result {
	position := c.Params.Get("position")
	name := c.Params.Get("name")
	positionName := c.Params.Get("position_name")

	files := c.Params.Files["photo"]
	if len(files) == 0 {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "No photo file uploaded"})
	}

	fileHeader := files[0]
	ext := filepath.Ext(fileHeader.Filename)

	if positionName != "" {
		url := positionName + ext
		_, err := c.DB.Exec(`UPDATE candidates SET photo_url = ? WHERE position_name = ?`, url, positionName)
		if err != nil {
			return c.RenderJSON(map[string]string{"message": "Failed to update photo_url in DB"})
		}

		file, err := fileHeader.Open()
		if err != nil {
			revel.AppLog.Errorf("Failed to open file: %v", err)
			c.Response.Status = http.StatusBadRequest
			return c.RenderJSON(map[string]string{"error": "Failed to open photo file"})
		}
		defer file.Close()

		baseDir := filepath.Join(revel.BasePath, "..", "web", "public", "uploads")
		revel.AppLog.Infof("Uploads directory: %s", baseDir)

		destinationPath := filepath.Join(baseDir, positionName+filepath.Ext(fileHeader.Filename))
		revel.AppLog.Infof("Saving file to: %s", destinationPath)
		destFile, err := os.Create(destinationPath)
		if err != nil {
			revel.AppLog.Errorf("Failed to create file: %v", err)
			c.Response.Status = http.StatusInternalServerError
			return c.RenderJSON(map[string]string{"error": "Failed to save photo"})
		}
		defer destFile.Close()

		_, err = io.Copy(destFile, file)
		if err != nil {
			revel.AppLog.Errorf("Failed to save file: %v", err)
			c.Response.Status = http.StatusInternalServerError
			return c.RenderJSON(map[string]string{"error": "Failed to save photo"})
		}
	} else {
		filename := position + "_" + name
		url := position + "_" + name + ext
		_, err := c.DB.Exec(`UPDATE candidates SET photo_url = ? WHERE position_name = ?`, url, filename)
		if err != nil {
			return c.RenderJSON(map[string]string{"message": "Failed to update photo_url in DB"})
		}

		file, err := fileHeader.Open()
		if err != nil {
			revel.AppLog.Errorf("Failed to open file: %v", err)
			c.Response.Status = http.StatusBadRequest
			return c.RenderJSON(map[string]string{"error": "Failed to open photo file"})
		}
		defer file.Close()

		baseDir := filepath.Join(revel.BasePath, "..", "web", "public", "uploads")
		revel.AppLog.Infof("Uploads directory: %s", baseDir)

		destinationPath := filepath.Join(baseDir, filename+filepath.Ext(fileHeader.Filename))
		revel.AppLog.Infof("Saving file to: %s", destinationPath)
		destFile, err := os.Create(destinationPath)
		if err != nil {
			revel.AppLog.Errorf("Failed to create file: %v", err)
			c.Response.Status = http.StatusInternalServerError
			return c.RenderJSON(map[string]string{"error": "Failed to save photo"})
		}
		defer destFile.Close()

		_, err = io.Copy(destFile, file)
		if err != nil {
			revel.AppLog.Errorf("Failed to save file: %v", err)
			c.Response.Status = http.StatusInternalServerError
			return c.RenderJSON(map[string]string{"error": "Failed to save photo"})
		}
	}

	return c.RenderJSON(map[string]string{"message": "Photo uploaded successfully"})
}

func (c *AdminController) PostCredentials() revel.Result {
	var candidates []struct {
		PositionName string   `json:"position_name"`
		Credentials  []string `json:"credentials"`
	}

	if err := c.Params.BindJSON(&candidates); err != nil {
		revel.AppLog.Errorf("Failed to parse request body: %v", err)
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request body"})
	}

	for _, candidate := range candidates {
		credentialsJSON, err := json.Marshal(candidate.Credentials)
		if err != nil {
			revel.AppLog.Errorf("Failed to convert credentials to JSON for %s: %v", candidate.PositionName, err)
			return c.RenderJSON(map[string]string{
				"error": "Failed to process credentials for " + candidate.PositionName,
			})
		}

		query := `
			UPDATE candidates 
			SET credentials = ?
			WHERE position_name = ?
		`

		_, err = c.DB.Exec(query, string(credentialsJSON), candidate.PositionName)
		if err != nil {
			revel.AppLog.Errorf("Failed to update credentials for %s: %v", candidate.PositionName, err)
			return c.RenderJSON(map[string]string{
				"error": "Failed to update credentials for " + candidate.PositionName,
			})
		}
	}

	return c.RenderJSON(map[string]string{"success": "All credentials updated successfully"})
}

// GetBackupList - List all backup files
func (c AdminController) GetBackupList() revel.Result {
	files, err := os.ReadDir("backup")
	if err != nil {
		return c.RenderJSON(map[string]string{"error": "Failed to read backup folder"})
	}

	var backupList []map[string]string
	for _, file := range files {
		if !file.IsDir() {
			backupList = append(backupList, map[string]string{
				"filename":    file.Name(),
				"downloadUrl": "/backup/" + file.Name(),
			})
		}
	}

	return c.RenderJSON(backupList)
}

func (c AdminController) GenerateBackup() revel.Result {
	year := time.Now().Year()
	nextYear := year + 1
	currentTime := time.Now().Format("January 02 15-04")
	filename := fmt.Sprintf("A.Y. %d-%d %s.xlsx", year, nextYear, currentTime)
	filePath := filepath.Join("backup", filename)

	f := excelize.NewFile()

	tables := map[string]func() [][]string{
		"ElectionSettings": db.GetElectionSettingsData,
		"Voters":           db.GetVotersData,
		"Votes":            db.GetVotesData,
		"Candidates":       db.GetCandidatesData,
	}

	firstSheet := true

	for sheetName, fetchFunc := range tables {
		data := fetchFunc()

		// Log the data being written to the sheet
		revel.AppLog.Infof("Data for sheet '%s': %v", sheetName, data)

		index, err := addSheetWithData(f, sheetName, data)
		if err != nil {
			revel.AppLog.Errorf("Failed to add %s sheet: %v", sheetName, err)
			return c.RenderJSON(map[string]string{"error": fmt.Sprintf("Failed to add %s sheet", sheetName)})
		}

		// Set active after creation
		f.SetActiveSheet(index)

		// Delete "Sheet1" only once after first real sheet is added
		if firstSheet {
			if f.GetSheetName(0) == "Sheet1" {
				f.DeleteSheet("Sheet1")
			}
			firstSheet = false
		}
	}

	if err := os.MkdirAll("backup", os.ModePerm); err != nil {
		revel.AppLog.Errorf("Failed to create backup directory: %v", err)
		return c.RenderJSON(map[string]string{"error": "Failed to create backup directory"})
	}

	if err := f.SaveAs(filePath); err != nil {
		revel.AppLog.Errorf("Failed to save backup file: %v", err)
		return c.RenderJSON(map[string]string{"error": "Failed to generate backup"})
	}

	return c.RenderJSON(map[string]string{"message": "Backup created successfully!"})
}

func addSheetWithData(f *excelize.File, sheetName string, data [][]string) (int, error) {
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return 0, fmt.Errorf("failed to create sheet %s: %w", sheetName, err)
	}

	if len(data) == 0 {
		data = [][]string{{"No Data Available"}}
	}

	for rowIndex, row := range data {
		for colIndex, cell := range row {
			cellRef, _ := excelize.CoordinatesToCellName(colIndex+1, rowIndex+1)

			// Sanitize cell value
			cell = db.SanitizeCellValue(cell)

			// Check for empty data
			if cell == "" {
				cell = "[Empty]"
			}

			// Check for excessive cell size
			if len(cell) > 32767 {
				revel.AppLog.Warnf("Cell at %d,%d exceeds Excel's character limit (32,767): truncating", rowIndex+1, colIndex+1)
				cell = cell[:32767]
			}

			// Log potential XML issues
			if strings.Contains(cell, "&") || strings.Contains(cell, "<") || strings.Contains(cell, ">") {
				revel.AppLog.Warnf("Potential XML issue in sheet '%s', cell %s: %q", sheetName, cellRef, cell)
			}

			// Write to sheet
			f.SetCellValue(sheetName, cellRef, cell)
		}
	}

	return index, nil
}

func (c *AdminController) UpdateCandidate() revel.Result {
	type UpdateRequest struct {
		PositionName string `json:"position_name"`
		Name         string `json:"name"`
		Position     string `json:"position"`
		YearLevel    string `json:"year_level"`
		Program      string `json:"program"`
		Partylist    string `json:"partylist"`
	}

	var req UpdateRequest
	if err := c.Params.BindJSON(&req); err != nil {
		c.Response.Status = 400
		return c.RenderJSON(map[string]interface{}{"error": "Invalid request payload"})
	}

	// Validate required fields
	if req.PositionName == "" || req.Name == "" || req.Position == "" || req.Partylist == "" {
		c.Response.Status = 400
		return c.RenderJSON(map[string]interface{}{"error": "Missing required fields"})
	}

	// Update query
	query := `UPDATE candidates SET
		name = ?,
		position = ?, 
		year_level = ?, 
		program = ?, 
		partylist = ? 
		WHERE position_name = ?`

	revel.AppLog.Infof("Executing query with values: %v, %v, %v, %v, %v, %v",
		req.Name, req.Position, req.YearLevel, req.Program, req.Partylist, req.PositionName)

	result, err := c.DB.Exec(query,
		req.Name,
		req.Position,
		req.YearLevel,
		req.Program,
		req.Partylist,
		req.PositionName,
	)

	if err != nil {
		revel.AppLog.Errorf("DB update failed: %v", err)
		c.Response.Status = 500
		return c.RenderJSON(map[string]interface{}{"error": "Database update failed"})
	}

	rowsAffected, _ := result.RowsAffected()
	revel.AppLog.Infof("Rows affected: %d", rowsAffected)
	if rowsAffected == 0 {
		c.Response.Status = 404
		return c.RenderJSON(map[string]interface{}{
			"error": "Candidate not found",
			"details": map[string]string{
				"position_name": req.PositionName,
				"name":          req.Name,
			},
		})
	}

	return c.RenderJSON(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"position_name": req.PositionName,
			"name":          req.Name,
			"position":      req.Position,
			"message":       "Candidate updated successfully",
		},
	})
}

func (c *AdminController) UpdateCredentials() revel.Result {
	var req struct {
		PositionName string   `json:"position_name"`
		Credentials  []string `json:"credentials"`
	}

	if err := c.Params.BindJSON(&req); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request payload"})
	}

	credentialsJSON, err := json.Marshal(req.Credentials)
	if err != nil {
		revel.AppLog.Errorf("Failed to marshal credentials: %v", err)
		return c.RenderJSON(map[string]string{"error": "Failed to process credentials"})
	}

	query := `UPDATE candidates SET credentials = ? WHERE position_name = ?`
	_, err = c.DB.Exec(query, string(credentialsJSON), req.PositionName)
	if err != nil {
		revel.AppLog.Errorf("Failed to update credentials for %s: %v", req.PositionName, err)
		return c.RenderJSON(map[string]string{"error": "Failed to update credentials"})
	}

	return c.RenderJSON(map[string]string{"success": "Credentials updated successfully"})
}

func (c *AdminController) GetVotesTally() revel.Result {
    rows, err := c.DB.Query(`
        SELECT 
            p.title AS position_title,
            c.name AS candidate_name,
            d.name AS department_name,
            v.total_votes
        FROM positions p
        JOIN candidates c ON c.position_id = p.id
        LEFT JOIN votes v ON v.candidate_id = c.id
        LEFT JOIN departments d ON v.department_id = d.id
        ORDER BY p.title, c.name, d.name
    `)
    if err != nil {
        revel.AppLog.Errorf("Failed to fetch votes tally: %v", err)
        return c.RenderJSON(map[string]string{"error": "Failed to fetch votes tally"})
    }
    defer rows.Close()

    positionsMap := make(map[string]map[string]interface{})
    for rows.Next() {
        var positionTitle, candidateName, departmentName string
        var totalVotes int
        if err := rows.Scan(&positionTitle, &candidateName, &departmentName, &totalVotes); err != nil {
            revel.AppLog.Errorf("Failed to scan row: %v", err)
            continue
        }

        if _, exists := positionsMap[positionTitle]; !exists {
            positionsMap[positionTitle] = map[string]interface{}{
                "title": positionTitle,
                "candidates": make(map[string]map[string]interface{}),
            }
        }

        candidates := positionsMap[positionTitle]["candidates"].(map[string]map[string]interface{})
        if _, exists := candidates[candidateName]; !exists {
            candidates[candidateName] = map[string]interface{}{
                "name":  candidateName,
                "votes": make(map[string]int),
                "total": 0,
            }
        }

        candidate := candidates[candidateName]
        candidate["votes"].(map[string]int)[departmentName] = totalVotes
        candidate["total"] = candidate["total"].(int) + totalVotes
    }

    var positions []map[string]interface{}
    for _, position := range positionsMap {
        candidates := position["candidates"].(map[string]map[string]interface{})
        var candidatesList []map[string]interface{}
        for _, candidate := range candidates {
            votes := candidate["votes"].(map[string]int)
            votesList := []int{}
            for _, dept := range []string{"Dept 1", "Dept 2", "Dept 3", "Dept 4", "Dept 5"} {
                votesList = append(votesList, votes[dept])
            }
            candidatesList = append(candidatesList, map[string]interface{}{
                "name":  candidate["name"],
                "votes": votesList,
                "total": candidate["total"],
            })
        }
        position["candidates"] = candidatesList
        positions = append(positions, position)
    }

    return c.RenderJSON(positions)
}
