package db

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"api/app/models"

	"github.com/golang-jwt/jwt"
	"github.com/revel/revel"
	"golang.org/x/crypto/bcrypt"
)

func GetDepartmentVoteQuery(department string) (string, error) {
	switch department {
	case "coe":
		return "SELECT coe_votes FROM votes WHERE position_name = ?", nil
	case "cba":
		return "SELECT cba_votes FROM votes WHERE position_name = ?", nil
	case "cics":
		return "SELECT cics_votes FROM votes WHERE position_name = ?", nil
	case "cit":
		return "SELECT cit_votes FROM votes WHERE position_name = ?", nil
	case "coed":
		return "SELECT coed_votes FROM votes WHERE position_name = ?", nil
	default:
		return "", sql.ErrNoRows
	}
}

func IdentifyDepartment(dept string) (string, error) {
	department := strings.ToLower(dept)

	switch department {
	case "bachelor of science in computer engineering",
		"bachelor of science in industrial engineering":
		return "coe_votes", nil
	case "bachelor of science in business administration major in financial management",
		"bachelor of science in business administration major in marketing management",
		"bachelor of science in entrepreneurship":
		return "cba_votes", nil
	case "bachelor of science in information technology":
		return "cics_votes", nil
	case "bachelor of industrial technology major in automotive",
		"bachelor of industrial technology major in drafting and digital graphics",
		"bachelor of industrial technology major in computer",
		"bachelor of industrial technology major in electronics",
		"bachelor of industrial technology major in electrical",
		"bachelor of industrial technology major in food processing":
		return "cit_votes", nil
	case "bachelor of secondary education major in science",
		"bachelor of secondary education major in mathematics",
		"bachelor of secondary education major in social studies",
		"bachelor of secondary education major in english minor in mandarin":
		return "coed_bsed", nil
	case "bachelor of elementary education",
		"bachelor of early childhood education":
		return "coed_beed", nil
	case "bachelor of physical education",
		"bachelor of technical vocational teacher education",
		"bachelor of technology and livelihood education major in home economics":
		return "coed_bped_btled_btvded", nil
	default:
		return "", sql.ErrNoRows
	}
}

func ScheduleElectionDeactivation(db *sql.DB, endTime time.Time) {
	duration := time.Until(endTime)
	if duration > 0 {
		log.Printf("Election deactivation scheduled in %v.\n", duration)
		time.AfterFunc(duration, func() {
			DeactivateElection(db)
		})
	} else {
		DeactivateElection(db)
	}
}

func DeactivateElection(db *sql.DB) {
	_, err := db.Exec(`UPDATE election_settings SET is_active = FALSE`)
	if err != nil {
		log.Printf("Failed to deactivate election: %v\n", err)
	} else {
		log.Println("Election successfully deactivated.")
	}
}

func RecoverElectionTimer(db *sql.DB) {
	var votingEnd time.Time
	var isActive bool

	err := db.QueryRow(`SELECT voting_end, is_active FROM election_settings LIMIT 1`).Scan(&votingEnd, &isActive)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("No election settings found.")
		} else {
			log.Printf("Failed to fetch election settings: %v\n", err)
		}
		return
	}

	if isActive {
		log.Println("Rescheduling election deactivation timer...")
		ScheduleElectionDeactivation(db, votingEnd)
	} else {
		log.Println("Election is already inactive.")
	}
}

func HashPassword(password string) (string, error) {
	// Hash the password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func ComparePasswords(storedHash, password string) bool {
	// Compare the hashed password with bcrypt
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
}

var jwtSecret = GenerateSecretKey()

func GenerateJWT(username string) (string, error) {
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 1).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func GenerateSecretKey() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic("Could not generate secret key")
	}
	return base64.StdEncoding.EncodeToString(b)
}

func ValidateJWT(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	return token, nil
}

// Fetch Voters
func GetVotersData() [][]string {
	rows, err := DB.Query("SELECT student_id, student_name, program, has_voted FROM voters")
	if err != nil {
		revel.AppLog.Errorf("Failed to fetch voters: %v", err)
		return nil
	}
	defer rows.Close()

	var voters []models.ExcelVoters
	for rows.Next() {
		var v models.ExcelVoters
		err := rows.Scan(&v.StudentID, &v.StudentName, &v.Program, &v.HasVoted)
		if err != nil {
			revel.AppLog.Errorf("Failed to scan voter: %v", err)
			continue
		}
		voters = append(voters, v)
	}

	data := [][]string{
		{"Student ID", "Name", "Program", "Has Voted"},
	}
	for _, v := range voters {
		hasVotedStr := "0"
		if v.HasVoted {
			hasVotedStr = "1"
		}
		data = append(data, []string{
			SanitizeCellValue(v.StudentID),
			SanitizeCellValue(v.StudentName),
			SanitizeCellValue(v.Program),
			hasVotedStr,
		})
	}

	return data
}

// Fetch Candidates
func GetCandidatesData() [][]string {
	rows, err := DB.Query(`SELECT position_name, name, position, year_level, program, partylist, credentials, photo_url FROM candidates`)
	if err != nil {
		revel.AppLog.Error("Error fetching candidates: ", "error", err)
		return nil
	}
	defer rows.Close()

	data := [][]string{
		{"Position Name", "Name", "Position", "Year Level", "Program", "Partylist", "Credentials", "Photo URL"},
	}

	for rows.Next() {
		var positionName, name, position, yearLevel, program, partylist, credentialsJSON, photoURL string
		if err := rows.Scan(&positionName, &name, &position, &yearLevel, &program, &partylist, &credentialsJSON, &photoURL); err != nil {
			revel.AppLog.Errorf("Failed to scan candidate row: %v", err)
			continue
		}

		// Parse credentials JSON into []string
		var credentials []string
		if err := json.Unmarshal([]byte(credentialsJSON), &credentials); err != nil {
			revel.AppLog.Warnf("Failed to parse credentials for %s: %v", name, err)
			// Handle gracefully (use raw JSON if parsing fails)
			credentials = []string{credentialsJSON}
		}

		// Convert []string to single comma-separated string for Excel
		credentialsString := strings.Join(credentials, " | ")

		data = append(data, []string{
			SanitizeCellValue(positionName),
			SanitizeCellValue(name),
			SanitizeCellValue(position),
			SanitizeCellValue(yearLevel),
			SanitizeCellValue(program),
			SanitizeCellValue(partylist),
			SanitizeCellValue(credentialsString),
			SanitizeCellValue(photoURL),
		})
	}

	return data
}

// Fetch Votes
func GetVotesData() [][]string {
	rows, err := DB.Query("SELECT position_name, name, position, coe_votes, cba_votes, cics_votes, cit_votes, coed_bsed, coed_beed, coed_bped, coed_votes, total_votes FROM votes")
	if err != nil {
		revel.AppLog.Errorf("Failed to fetch votes: %v", err)
		return nil
	}
	defer rows.Close()

	var votes []models.ExcelVotes
	for rows.Next() {
		var v models.ExcelVotes
		err := rows.Scan(&v.PositionName, &v.Name, &v.Position, &v.COEVotes, &v.CBAVotes, &v.CICSVotes, &v.CITVotes,
			&v.COEDBSED, &v.COEDBEED, &v.COEDBPED, &v.COEDVotes, &v.TotalVotes)
		if err != nil {
			revel.AppLog.Errorf("Failed to scan vote: %v", err)
			continue
		}
		votes = append(votes, v)
	}

	data := [][]string{
		{"Position Name", "Name", "Position", "COE Votes", "CBA Votes", "CICS Votes", "CIT Votes", "COED BSED Votes", "COED BEED Votes", "COED BPED Votes", "COED Total Votes", "Final Total Votes"},
	}
	for _, v := range votes {
		data = append(data, []string{
			SanitizeCellValue(v.PositionName),
			SanitizeCellValue(v.Name),
			SanitizeCellValue(v.Position),
			fmt.Sprintf("%d", v.COEVotes),
			fmt.Sprintf("%d", v.CBAVotes),
			fmt.Sprintf("%d", v.CICSVotes),
			fmt.Sprintf("%d", v.CITVotes),
			fmt.Sprintf("%d", v.COEDBSED),
			fmt.Sprintf("%d", v.COEDBEED),
			fmt.Sprintf("%d", v.COEDBPED),
			fmt.Sprintf("%d", v.COEDVotes),
			fmt.Sprintf("%d", v.TotalVotes),
		})
	}

	return data
}

// Fetch Election Settings
func GetElectionSettingsData() [][]string {
	rows, err := DB.Query("SELECT voting_start, voting_end FROM election_settings")
	if err != nil {
		revel.AppLog.Errorf("Failed to fetch election settings: %v", err)
		return nil
	}
	defer rows.Close()

	var settings []models.ExcelElectionSetting
	for rows.Next() {
		var s models.ExcelElectionSetting
		err := rows.Scan(&s.VotingStart, &s.VotingEnd)
		if err != nil {
			revel.AppLog.Errorf("Failed to scan election setting: %v", err)
			continue
		}
		settings = append(settings, s)
	}

	data := [][]string{
		{"Voting Start", "Voting End"},
	}
	for _, s := range settings {
		data = append(data, []string{
			SanitizeCellValue(s.VotingStart),
			SanitizeCellValue(s.VotingEnd),
		})
	}

	return data
}

// Sanitize cell values (removes problematic characters)
func SanitizeCellValue(value string) string {
	// Remove invalid XML characters
	value = strings.Map(func(r rune) rune {
		if r == 0x9 || r == 0xA || r == 0xD || (r >= 0x20 && r <= 0xD7FF) || (r >= 0xE000 && r <= 0xFFFD) {
			return r
		}
		return -1
	}, value)

	// Replace other problematic characters
	value = strings.ReplaceAll(value, "\n", " ")
	value = strings.ReplaceAll(value, "\r", " ")
	value = strings.ReplaceAll(value, "\x00", "")
	return value
}
