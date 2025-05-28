package app

import (
	"api/app/controllers"
	"api/app/db" // ✅ Import the db package
	"net/http"

	"github.com/revel/revel"
)

func init() {
	revel.Filters = []revel.Filter{
		revel.PanicFilter,
		CORSFilter,
		revel.RouterFilter,
		revel.FilterConfiguringFilter,
		revel.ParamsFilter,
		revel.SessionFilter,
		revel.FlashFilter,
		revel.ValidationFilter,
		revel.I18nFilter,
		HeaderFilter,
		revel.InterceptorFilter,
		revel.CompressFilter,
		revel.BeforeAfterFilter,
		revel.ActionInvoker,
	}

	revel.OnAppStart(func() {
		db.InitDB()                    // Initialize DB
		db.RecoverElectionTimer(db.DB) // Recover timer after DB is initialized
		http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads/"))))
	})
	revel.InterceptMethod((*controllers.AdminController).SetDB, revel.BEFORE)
	revel.InterceptMethod((*controllers.CandidatesController).SetDB, revel.BEFORE)
	revel.InterceptMethod((*controllers.LiveVotesController).SetDB, revel.BEFORE)
	revel.InterceptMethod((*controllers.SigninController).SetDB, revel.BEFORE)
	revel.InterceptMethod((*controllers.VotingController).SetDB, revel.BEFORE)
	revel.InterceptMethod((*controllers.RegistrationController).SetDB, revel.BEFORE)
}

// HeaderFilter adds common security headers
var HeaderFilter = func(c *revel.Controller, fc []revel.Filter) {
	c.Response.Out.Header().Add("X-Frame-Options", "SAMEORIGIN")
	c.Response.Out.Header().Add("X-XSS-Protection", "1; mode=block")
	c.Response.Out.Header().Add("X-Content-Type-Options", "nosniff")
	c.Response.Out.Header().Add("Referrer-Policy", "strict-origin-when-cross-origin")

	fc[0](c, fc[1:])
}

// CORSFilter handles Cross-Origin Resource Sharing (CORS)
var CORSFilter = func(c *revel.Controller, fc []revel.Filter) {
	//c.Response.Out.Header().Add("Access-Control-Allow-Origin", "*")
	c.Response.Out.Header().Add("Access-Control-Allow-Origin", "https://votingkioskthesis.vercel.app")
	c.Response.Out.Header().Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	c.Response.Out.Header().Add("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, Ngrok-Skip-Browser-Warning")
	c.Response.Out.Header().Add("Access-Control-Allow-Credentials", "true")

	// Handle preflight OPTIONS request
	if c.Request.Method == "OPTIONS" {
		c.Response.Status = 200
		return
	}

	fc[0](c, fc[1:])
}
