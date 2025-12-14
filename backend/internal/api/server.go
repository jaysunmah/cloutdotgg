package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Server holds dependencies for the API
type Server struct {
	db *pgxpool.Pool
}

// NewServer creates a new API server
func NewServer(db *pgxpool.Pool) *Server {
	return &Server{db: db}
}

// Routes sets up the router with all API routes
func (s *Server) Routes() *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// CORS configuration for Next.js frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://*.vercel.app", "https://*.railway.app", "https://*.up.railway.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", s.handleHealth)

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Stats
		r.Get("/stats", s.handleGetStats)
		
		// Categories
		r.Get("/categories", s.handleGetCategories)

		// Companies
		r.Route("/companies", func(r chi.Router) {
			r.Get("/", s.handleListCompanies)
			r.Get("/{slug}", s.handleGetCompany)
			r.Get("/{slug}/ratings", s.handleGetCompanyRatings)
			r.Get("/{slug}/comments", s.handleGetCompanyComments)
		})

		// Voting
		r.Route("/vote", func(r chi.Router) {
			r.Get("/matchup", s.handleGetMatchup)
			r.Post("/", s.handleVote)
		})

		// Leaderboard
		r.Get("/leaderboard", s.handleGetLeaderboard)

		// Ratings
		r.Post("/ratings", s.handleSubmitRating)

		// Comments
		r.Route("/comments", func(r chi.Router) {
			r.Post("/", s.handleSubmitComment)
			r.Post("/{id}/upvote", s.handleUpvoteComment)
		})
	})

	return r
}
