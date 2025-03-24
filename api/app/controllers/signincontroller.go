package controllers

import (
	"api/app/db"
	"api/app/models"
	"database/sql"
	"net/http"

	"github.com/revel/revel"
	"golang.org/x/crypto/bcrypt"
)

type SigninController struct {
	*revel.Controller
	DB *sql.DB
}

func (c *SigninController) SetDB() revel.Result {
	c.DB = db.DBInstance()
	return nil
}

func (c *SigninController) Signin() revel.Result {
	var request models.Signin
	if err := c.Params.BindJSON(&request); err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Invalid request body"})
	}

	var hashedPassword string
	err := c.DB.QueryRow("SELECT password_hash FROM admin WHERE username = ?", request.Username).Scan(&hashedPassword)
	if err == sql.ErrNoRows {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Username not found"})
	} else if err != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Incorrect username or password"})
	}

	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(request.Password)) != nil {
		c.Response.Status = http.StatusBadRequest
		return c.RenderJSON(map[string]string{"error": "Incorrect password"})
	}

	tokenString, err := db.GenerateJWT(request.Username)
	if err != nil {
		c.Response.Status = http.StatusInternalServerError
		return c.RenderJSON(map[string]string{"error": "Could not generate token"})
	}

	return c.RenderJSON(map[string]string{
		"message": "Signin successful",
		"token":   tokenString,
	})
}
