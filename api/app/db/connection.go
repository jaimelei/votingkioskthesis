package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql" // MySQL driver
	"github.com/joho/godotenv"         // Load .env file
	"github.com/revel/revel"
)

var (
	DB *sql.DB
)

// InitDB connects to the MySQL database
func InitDB() {
	// Load .env file (optional, for local development)
	err := godotenv.Load()
	if err != nil {
		revel.AppLog.Info("⚠️ No .env file found, relying on system environment variables.")
	}

	// Read environment variables
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	// Construct the DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPassword, dbHost, dbPort, dbName)
	revel.AppLog.Info("DSN:", dsn)

	// Connect to the database
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		revel.AppLog.Fatal("❌ Failed to connect to DB:", "error", err)
	}

	// Ping the database to verify the connection
	if err = DB.Ping(); err != nil {
		revel.AppLog.Fatal("❌ DB ping failed:", "error", err)
	}

	revel.AppLog.Info("✅ Database connection established successfully!")
}

// DBInstance returns the global DB instance
func DBInstance() *sql.DB {
	return DB
}
