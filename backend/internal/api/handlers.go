package api

import (
	"context"
	"encoding/json"
	"math"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/cloutdotgg/backend/internal/pb"
	"github.com/go-chi/chi/v5"
)

// Company represents an AI company
type Company struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Slug          string    `json:"slug"`
	LogoURL       *string   `json:"logo_url"`
	Description   *string   `json:"description"`
	Website       *string   `json:"website"`
	Category      string    `json:"category"`
	Tags          []string  `json:"tags"`
	FoundedYear   *int      `json:"founded_year"`
	HQLocation    *string   `json:"hq_location"`
	EmployeeRange *string   `json:"employee_range"`
	FundingStage  *string   `json:"funding_stage"`
	EloRating     int       `json:"elo_rating"`
	TotalVotes    int       `json:"total_votes"`
	Wins          int       `json:"wins"`
	Losses        int       `json:"losses"`
	Rank          int       `json:"rank,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Vote represents a head-to-head vote
type Vote struct {
	ID        int       `json:"id"`
	WinnerID  int       `json:"winner_id"`
	LoserID   int       `json:"loser_id"`
	SessionID *string   `json:"session_id"`
	CreatedAt time.Time `json:"created_at"`
}

// VoteRequest represents a voting request
type VoteRequest struct {
	WinnerID  int    `json:"winner_id"`
	LoserID   int    `json:"loser_id"`
	SessionID string `json:"session_id"`
}

// VoteResponse represents the voting response with updated ELOs
type VoteResponse struct {
	Winner        Company `json:"winner"`
	Loser         Company `json:"loser"`
	WinnerEloDiff int     `json:"winner_elo_diff"`
	LoserEloDiff  int     `json:"loser_elo_diff"`
}

// MatchupPair represents two companies for voting
type MatchupPair struct {
	Company1 Company `json:"company1"`
	Company2 Company `json:"company2"`
}

// CompanyRating represents a rating for a specific criterion
type CompanyRating struct {
	ID        int       `json:"id"`
	CompanyID int       `json:"company_id"`
	Criterion string    `json:"criterion"`
	Score     int       `json:"score"`
	SessionID *string   `json:"session_id"`
	CreatedAt time.Time `json:"created_at"`
}

// RatingRequest represents a rating submission
type RatingRequest struct {
	CompanyID int    `json:"company_id"`
	Criterion string `json:"criterion"`
	Score     int    `json:"score"`
	SessionID string `json:"session_id"`
}

// AggregatedRating represents aggregated ratings for a criterion
type AggregatedRating struct {
	Criterion    string  `json:"criterion"`
	AverageScore float64 `json:"average_score"`
	TotalRatings int     `json:"total_ratings"`
}

// CompanyComment represents a comment/review
type CompanyComment struct {
	ID                int       `json:"id"`
	CompanyID         int       `json:"company_id"`
	Content           string    `json:"content"`
	IsCurrentEmployee bool      `json:"is_current_employee"`
	SessionID         *string   `json:"session_id"`
	Upvotes           int       `json:"upvotes"`
	CreatedAt         time.Time `json:"created_at"`
}

// CommentRequest represents a comment submission
type CommentRequest struct {
	CompanyID         int    `json:"company_id"`
	Content           string `json:"content"`
	IsCurrentEmployee bool   `json:"is_current_employee"`
	SessionID         string `json:"session_id"`
}

// LeaderboardResponse represents the leaderboard data
type LeaderboardResponse struct {
	Companies  []Company `json:"companies"`
	TotalCount int       `json:"total_count"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
}

// StatsResponse represents overall platform stats
type StatsResponse struct {
	TotalCompanies int      `json:"total_companies"`
	TotalVotes     int      `json:"total_votes"`
	TotalRatings   int      `json:"total_ratings"`
	TotalComments  int      `json:"total_comments"`
	Categories     []string `json:"categories"`
}

// Health check handler
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := s.db.Ping(ctx); err != nil {
		jsonData := map[string]string{
			"status":   "unhealthy",
			"database": "disconnected",
		}
		protoMsg := HealthResponseToProto("unhealthy", "disconnected")
		respond(w, r, http.StatusServiceUnavailable, jsonData, protoMsg)
		return
	}

	jsonData := map[string]string{
		"status":   "healthy",
		"database": "connected",
	}
	protoMsg := HealthResponseToProto("healthy", "connected")
	respond(w, r, http.StatusOK, jsonData, protoMsg)
}

// Get platform stats
func (s *Server) handleGetStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var stats StatsResponse

	// Get total companies
	err := s.db.QueryRow(ctx, "SELECT COUNT(*) FROM companies").Scan(&stats.TotalCompanies)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch stats")
		return
	}

	// Get total votes
	err = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM votes").Scan(&stats.TotalVotes)
	if err != nil {
		stats.TotalVotes = 0
	}

	// Get total ratings
	err = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM company_ratings").Scan(&stats.TotalRatings)
	if err != nil {
		stats.TotalRatings = 0
	}

	// Get total comments
	err = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM company_comments").Scan(&stats.TotalComments)
	if err != nil {
		stats.TotalComments = 0
	}

	// Get categories
	rows, err := s.db.Query(ctx, "SELECT DISTINCT category FROM companies ORDER BY category")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var cat string
			if err := rows.Scan(&cat); err == nil {
				stats.Categories = append(stats.Categories, cat)
			}
		}
	}

	if stats.Categories == nil {
		stats.Categories = []string{}
	}

	respond(w, r, http.StatusOK, stats, StatsResponseToProto(&stats))
}

// List all companies (with optional filtering)
func (s *Server) handleListCompanies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	query := `
		SELECT id, name, slug, logo_url, description, website, category, tags,
		       founded_year, hq_location, employee_range, funding_stage,
		       elo_rating, total_votes, wins, losses, created_at, updated_at
		FROM companies
		WHERE 1=1
	`
	args := []interface{}{}
	argNum := 1

	if category != "" && category != "all" {
		query += " AND category = $" + strconv.Itoa(argNum)
		args = append(args, category)
		argNum++
	}

	if search != "" {
		query += " AND (LOWER(name) LIKE $" + strconv.Itoa(argNum) + " OR LOWER(description) LIKE $" + strconv.Itoa(argNum) + ")"
		args = append(args, "%"+strings.ToLower(search)+"%")
		argNum++
	}

	query += " ORDER BY elo_rating DESC, total_votes DESC"

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch companies")
		return
	}
	defer rows.Close()

	var companies []Company
	rank := 1
	for rows.Next() {
		var c Company
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.LogoURL, &c.Description, &c.Website,
			&c.Category, &c.Tags, &c.FoundedYear, &c.HQLocation, &c.EmployeeRange,
			&c.FundingStage, &c.EloRating, &c.TotalVotes, &c.Wins, &c.Losses,
			&c.CreatedAt, &c.UpdatedAt); err != nil {
			respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to scan company")
			return
		}
		c.Rank = rank
		rank++
		if c.Tags == nil {
			c.Tags = []string{}
		}
		companies = append(companies, c)
	}

	if companies == nil {
		companies = []Company{}
	}

	respond(w, r, http.StatusOK, companies, CompaniesToProto(companies))
}

// Get company by slug
func (s *Server) handleGetCompany(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	ctx := r.Context()

	var c Company
	err := s.db.QueryRow(ctx, `
		SELECT id, name, slug, logo_url, description, website, category, tags,
		       founded_year, hq_location, employee_range, funding_stage,
		       elo_rating, total_votes, wins, losses, created_at, updated_at
		FROM companies
		WHERE slug = $1
	`, slug).Scan(&c.ID, &c.Name, &c.Slug, &c.LogoURL, &c.Description, &c.Website,
		&c.Category, &c.Tags, &c.FoundedYear, &c.HQLocation, &c.EmployeeRange,
		&c.FundingStage, &c.EloRating, &c.TotalVotes, &c.Wins, &c.Losses,
		&c.CreatedAt, &c.UpdatedAt)

	if err != nil {
		respondErrorWithProto(w, r, http.StatusNotFound, "Company not found")
		return
	}

	// Get rank
	err = s.db.QueryRow(ctx, `
		SELECT COUNT(*) + 1 FROM companies WHERE elo_rating > $1
	`, c.EloRating).Scan(&c.Rank)
	if err != nil {
		c.Rank = 0
	}

	if c.Tags == nil {
		c.Tags = []string{}
	}

	respond(w, r, http.StatusOK, c, CompanyToProto(&c))
}

// Get a random matchup pair for voting
func (s *Server) handleGetMatchup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	category := r.URL.Query().Get("category")

	query := `
		SELECT id, name, slug, logo_url, description, website, category, tags,
		       founded_year, hq_location, employee_range, funding_stage,
		       elo_rating, total_votes, wins, losses, created_at, updated_at
		FROM companies
	`

	args := []interface{}{}
	if category != "" && category != "all" {
		query += " WHERE category = $1"
		args = append(args, category)
	}

	query += " ORDER BY RANDOM() LIMIT 2"

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch matchup")
		return
	}
	defer rows.Close()

	var companies []Company
	for rows.Next() {
		var c Company
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.LogoURL, &c.Description, &c.Website,
			&c.Category, &c.Tags, &c.FoundedYear, &c.HQLocation, &c.EmployeeRange,
			&c.FundingStage, &c.EloRating, &c.TotalVotes, &c.Wins, &c.Losses,
			&c.CreatedAt, &c.UpdatedAt); err != nil {
			respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to scan company")
			return
		}
		if c.Tags == nil {
			c.Tags = []string{}
		}
		companies = append(companies, c)
	}

	if len(companies) < 2 {
		respondErrorWithProto(w, r, http.StatusNotFound, "Not enough companies for matchup")
		return
	}

	// Randomize order
	if rand.Float32() > 0.5 {
		companies[0], companies[1] = companies[1], companies[0]
	}

	matchup := MatchupPair{
		Company1: companies[0],
		Company2: companies[1],
	}

	respond(w, r, http.StatusOK, matchup, MatchupPairToProto(&matchup))
}

// Submit a vote
func (s *Server) handleVote(w http.ResponseWriter, r *http.Request) {
	var req VoteRequest
	var pbReq pb.VoteRequest

	if isProtobufRequest(r) {
		if err := decodeProtoRequest(r, &pbReq); err != nil {
			respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid request body")
			return
		}
		req = *VoteRequestFromProto(&pbReq)
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid request body")
			return
		}
	}

	if req.WinnerID == req.LoserID {
		respondErrorWithProto(w, r, http.StatusBadRequest, "Winner and loser must be different")
		return
	}

	ctx := r.Context()

	// Get current ELO ratings
	var winnerElo, loserElo int
	err := s.db.QueryRow(ctx, "SELECT elo_rating FROM companies WHERE id = $1", req.WinnerID).Scan(&winnerElo)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusNotFound, "Winner company not found")
		return
	}
	err = s.db.QueryRow(ctx, "SELECT elo_rating FROM companies WHERE id = $1", req.LoserID).Scan(&loserElo)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusNotFound, "Loser company not found")
		return
	}

	// Calculate new ELO ratings
	kFactor := 32.0
	expectedWinner := 1.0 / (1.0 + math.Pow(10, float64(loserElo-winnerElo)/400))
	expectedLoser := 1.0 - expectedWinner

	newWinnerElo := int(float64(winnerElo) + kFactor*(1-expectedWinner))
	newLoserElo := int(float64(loserElo) + kFactor*(0-expectedLoser))

	winnerEloDiff := newWinnerElo - winnerElo
	loserEloDiff := newLoserElo - loserElo

	// Update winner
	_, err = s.db.Exec(ctx, `
		UPDATE companies 
		SET elo_rating = $1, total_votes = total_votes + 1, wins = wins + 1, updated_at = NOW()
		WHERE id = $2
	`, newWinnerElo, req.WinnerID)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to update winner")
		return
	}

	// Update loser
	_, err = s.db.Exec(ctx, `
		UPDATE companies 
		SET elo_rating = $1, total_votes = total_votes + 1, losses = losses + 1, updated_at = NOW()
		WHERE id = $2
	`, newLoserElo, req.LoserID)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to update loser")
		return
	}

	// Record vote
	sessionID := req.SessionID
	_, err = s.db.Exec(ctx, `
		INSERT INTO votes (winner_id, loser_id, session_id)
		VALUES ($1, $2, $3)
	`, req.WinnerID, req.LoserID, sessionID)
	if err != nil {
		// Non-critical, continue
	}

	// Get updated companies
	var winner, loser Company
	err = s.db.QueryRow(ctx, `
		SELECT id, name, slug, logo_url, description, website, category, tags,
		       founded_year, hq_location, employee_range, funding_stage,
		       elo_rating, total_votes, wins, losses, created_at, updated_at
		FROM companies WHERE id = $1
	`, req.WinnerID).Scan(&winner.ID, &winner.Name, &winner.Slug, &winner.LogoURL, &winner.Description, &winner.Website,
		&winner.Category, &winner.Tags, &winner.FoundedYear, &winner.HQLocation, &winner.EmployeeRange,
		&winner.FundingStage, &winner.EloRating, &winner.TotalVotes, &winner.Wins, &winner.Losses,
		&winner.CreatedAt, &winner.UpdatedAt)

	if err == nil {
		if winner.Tags == nil {
			winner.Tags = []string{}
		}
	}

	err = s.db.QueryRow(ctx, `
		SELECT id, name, slug, logo_url, description, website, category, tags,
		       founded_year, hq_location, employee_range, funding_stage,
		       elo_rating, total_votes, wins, losses, created_at, updated_at
		FROM companies WHERE id = $1
	`, req.LoserID).Scan(&loser.ID, &loser.Name, &loser.Slug, &loser.LogoURL, &loser.Description, &loser.Website,
		&loser.Category, &loser.Tags, &loser.FoundedYear, &loser.HQLocation, &loser.EmployeeRange,
		&loser.FundingStage, &loser.EloRating, &loser.TotalVotes, &loser.Wins, &loser.Losses,
		&loser.CreatedAt, &loser.UpdatedAt)

	if err == nil {
		if loser.Tags == nil {
			loser.Tags = []string{}
		}
	}

	voteResp := VoteResponse{
		Winner:        winner,
		Loser:         loser,
		WinnerEloDiff: winnerEloDiff,
		LoserEloDiff:  loserEloDiff,
	}

	respond(w, r, http.StatusOK, voteResp, VoteResponseToProto(&voteResp))
}

// Get leaderboard
func (s *Server) handleGetLeaderboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	category := r.URL.Query().Get("category")
	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("page_size")

	page := 1
	pageSize := 25
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
		pageSize = ps
	}

	offset := (page - 1) * pageSize

	// Get total count
	var totalCount int
	countQuery := "SELECT COUNT(*) FROM companies"
	countArgs := []interface{}{}
	if category != "" && category != "all" {
		countQuery += " WHERE category = $1"
		countArgs = append(countArgs, category)
	}
	err := s.db.QueryRow(ctx, countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		totalCount = 0
	}

	// Get companies
	query := `
		SELECT id, name, slug, logo_url, description, website, category, tags,
		       founded_year, hq_location, employee_range, funding_stage,
		       elo_rating, total_votes, wins, losses, created_at, updated_at
		FROM companies
	`
	args := []interface{}{}
	argNum := 1

	if category != "" && category != "all" {
		query += " WHERE category = $" + strconv.Itoa(argNum)
		args = append(args, category)
		argNum++
	}

	query += " ORDER BY elo_rating DESC, total_votes DESC"
	query += " LIMIT $" + strconv.Itoa(argNum) + " OFFSET $" + strconv.Itoa(argNum+1)
	args = append(args, pageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch leaderboard")
		return
	}
	defer rows.Close()

	var companies []Company
	rank := offset + 1
	for rows.Next() {
		var c Company
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.LogoURL, &c.Description, &c.Website,
			&c.Category, &c.Tags, &c.FoundedYear, &c.HQLocation, &c.EmployeeRange,
			&c.FundingStage, &c.EloRating, &c.TotalVotes, &c.Wins, &c.Losses,
			&c.CreatedAt, &c.UpdatedAt); err != nil {
			respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to scan company")
			return
		}
		c.Rank = rank
		rank++
		if c.Tags == nil {
			c.Tags = []string{}
		}
		companies = append(companies, c)
	}

	if companies == nil {
		companies = []Company{}
	}

	leaderboardResp := LeaderboardResponse{
		Companies:  companies,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
	}

	respond(w, r, http.StatusOK, leaderboardResp, LeaderboardResponseToProto(&leaderboardResp))
}

// Submit a rating for a company
func (s *Server) handleSubmitRating(w http.ResponseWriter, r *http.Request) {
	var req RatingRequest
	var pbReq pb.RatingRequest

	if isProtobufRequest(r) {
		if err := decodeProtoRequest(r, &pbReq); err != nil {
			respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid request body")
			return
		}
		req = *RatingRequestFromProto(&pbReq)
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid request body")
			return
		}
	}

	if req.Score < 1 || req.Score > 5 {
		respondErrorWithProto(w, r, http.StatusBadRequest, "Score must be between 1 and 5")
		return
	}

	validCriteria := map[string]bool{
		"compensation":      true,
		"culture":           true,
		"work_life_balance": true,
		"growth":            true,
		"tech_stack":        true,
		"leadership":        true,
		"interview":         true,
	}
	if !validCriteria[req.Criterion] {
		respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid criterion")
		return
	}

	ctx := r.Context()

	// Verify company exists
	var exists bool
	err := s.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM companies WHERE id = $1)", req.CompanyID).Scan(&exists)
	if err != nil || !exists {
		respondErrorWithProto(w, r, http.StatusNotFound, "Company not found")
		return
	}

	// Insert rating
	var rating CompanyRating
	sessionID := req.SessionID
	err = s.db.QueryRow(ctx, `
		INSERT INTO company_ratings (company_id, criterion, score, session_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, company_id, criterion, score, session_id, created_at
	`, req.CompanyID, req.Criterion, req.Score, sessionID).Scan(
		&rating.ID, &rating.CompanyID, &rating.Criterion, &rating.Score, &rating.SessionID, &rating.CreatedAt)

	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to submit rating")
		return
	}

	respond(w, r, http.StatusCreated, rating, CompanyRatingToProto(&rating))
}

// Get ratings for a company
func (s *Server) handleGetCompanyRatings(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	ctx := r.Context()

	// Get company ID from slug
	var companyID int
	err := s.db.QueryRow(ctx, "SELECT id FROM companies WHERE slug = $1", slug).Scan(&companyID)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusNotFound, "Company not found")
		return
	}

	rows, err := s.db.Query(ctx, `
		SELECT criterion, AVG(score)::float, COUNT(*)
		FROM company_ratings
		WHERE company_id = $1
		GROUP BY criterion
	`, companyID)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch ratings")
		return
	}
	defer rows.Close()

	var ratings []AggregatedRating
	for rows.Next() {
		var r AggregatedRating
		if err := rows.Scan(&r.Criterion, &r.AverageScore, &r.TotalRatings); err != nil {
			continue
		}
		ratings = append(ratings, r)
	}

	if ratings == nil {
		ratings = []AggregatedRating{}
	}

	respond(w, r, http.StatusOK, ratings, AggregatedRatingsToProto(ratings))
}

// Submit a comment for a company
func (s *Server) handleSubmitComment(w http.ResponseWriter, r *http.Request) {
	var req CommentRequest
	var pbReq pb.CommentRequest

	if isProtobufRequest(r) {
		if err := decodeProtoRequest(r, &pbReq); err != nil {
			respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid request body")
			return
		}
		req = *CommentRequestFromProto(&pbReq)
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid request body")
			return
		}
	}

	if strings.TrimSpace(req.Content) == "" {
		respondErrorWithProto(w, r, http.StatusBadRequest, "Content is required")
		return
	}

	if len(req.Content) > 2000 {
		respondErrorWithProto(w, r, http.StatusBadRequest, "Content too long (max 2000 characters)")
		return
	}

	ctx := r.Context()

	// Verify company exists
	var exists bool
	err := s.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM companies WHERE id = $1)", req.CompanyID).Scan(&exists)
	if err != nil || !exists {
		respondErrorWithProto(w, r, http.StatusNotFound, "Company not found")
		return
	}

	// Insert comment
	var comment CompanyComment
	sessionID := req.SessionID
	err = s.db.QueryRow(ctx, `
		INSERT INTO company_comments (company_id, content, is_current_employee, session_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, company_id, content, is_current_employee, session_id, upvotes, created_at
	`, req.CompanyID, req.Content, req.IsCurrentEmployee, sessionID).Scan(
		&comment.ID, &comment.CompanyID, &comment.Content, &comment.IsCurrentEmployee,
		&comment.SessionID, &comment.Upvotes, &comment.CreatedAt)

	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to submit comment")
		return
	}

	respond(w, r, http.StatusCreated, comment, CompanyCommentToProto(&comment))
}

// Get comments for a company
func (s *Server) handleGetCompanyComments(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	ctx := r.Context()

	// Get company ID from slug
	var companyID int
	err := s.db.QueryRow(ctx, "SELECT id FROM companies WHERE slug = $1", slug).Scan(&companyID)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusNotFound, "Company not found")
		return
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, company_id, content, is_current_employee, session_id, upvotes, created_at
		FROM company_comments
		WHERE company_id = $1
		ORDER BY upvotes DESC, created_at DESC
		LIMIT 100
	`, companyID)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}
	defer rows.Close()

	var comments []CompanyComment
	for rows.Next() {
		var c CompanyComment
		if err := rows.Scan(&c.ID, &c.CompanyID, &c.Content, &c.IsCurrentEmployee,
			&c.SessionID, &c.Upvotes, &c.CreatedAt); err != nil {
			continue
		}
		comments = append(comments, c)
	}

	if comments == nil {
		comments = []CompanyComment{}
	}

	respond(w, r, http.StatusOK, comments, CompanyCommentsToProto(comments))
}

// Upvote a comment
func (s *Server) handleUpvoteComment(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	ctx := r.Context()

	var comment CompanyComment
	err = s.db.QueryRow(ctx, `
		UPDATE company_comments
		SET upvotes = upvotes + 1
		WHERE id = $1
		RETURNING id, company_id, content, is_current_employee, session_id, upvotes, created_at
	`, id).Scan(&comment.ID, &comment.CompanyID, &comment.Content, &comment.IsCurrentEmployee,
		&comment.SessionID, &comment.Upvotes, &comment.CreatedAt)

	if err != nil {
		respondErrorWithProto(w, r, http.StatusNotFound, "Comment not found")
		return
	}

	respond(w, r, http.StatusOK, comment, CompanyCommentToProto(&comment))
}

// Get categories
func (s *Server) handleGetCategories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := s.db.Query(ctx, `
		SELECT category, COUNT(*) as count
		FROM companies
		GROUP BY category
		ORDER BY count DESC
	`)
	if err != nil {
		respondErrorWithProto(w, r, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}
	defer rows.Close()

	type CategoryCount struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}

	var categories []CategoryCount
	var pbCategories []*pb.CategoryCount
	for rows.Next() {
		var c CategoryCount
		if err := rows.Scan(&c.Category, &c.Count); err != nil {
			continue
		}
		categories = append(categories, c)
		pbCategories = append(pbCategories, CategoryCountToProto(c.Category, c.Count))
	}

	if categories == nil {
		categories = []CategoryCount{}
	}
	if pbCategories == nil {
		pbCategories = []*pb.CategoryCount{}
	}

	respond(w, r, http.StatusOK, categories, &pb.CategoryCountList{Categories: pbCategories})
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
