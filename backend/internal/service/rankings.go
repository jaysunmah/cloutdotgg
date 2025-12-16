package service

import (
	"context"
	"math"
	"math/rand"
	"strings"

	"connectrpc.com/connect"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/cloutdotgg/backend/internal/db/sqlc"
	gen "github.com/cloutdotgg/backend/internal/gen/proto/apiv1"
)

// RankingsService implements the RankingsServiceHandler interface
type RankingsService struct {
	db      *pgxpool.Pool
	queries *sqlc.Queries
}

// NewRankingsService creates a new rankings service
func NewRankingsService(db *pgxpool.Pool) *RankingsService {
	return &RankingsService{
		db:      db,
		queries: sqlc.New(db),
	}
}

// Helper to convert sqlc Company to proto Company
func companyToProto(c sqlc.Company, rank int32) *gen.Company {
	pc := &gen.Company{
		Id:         c.ID,
		Name:       c.Name,
		Slug:       c.Slug,
		Category:   c.Category,
		Tags:       c.Tags,
		EloRating:  c.EloRating,
		TotalVotes: c.TotalVotes,
		Wins:       c.Wins,
		Losses:     c.Losses,
		Rank:       rank,
	}

	if c.LogoUrl != nil {
		pc.LogoUrl = c.LogoUrl
	}
	if c.Description != nil {
		pc.Description = c.Description
	}
	if c.Website != nil {
		pc.Website = c.Website
	}
	if c.FoundedYear != nil {
		pc.FoundedYear = c.FoundedYear
	}
	if c.HqLocation != nil {
		pc.HqLocation = c.HqLocation
	}
	if c.EmployeeRange != nil {
		pc.EmployeeRange = c.EmployeeRange
	}
	if c.FundingStage != nil {
		pc.FundingStage = c.FundingStage
	}
	if c.CreatedAt.Valid {
		pc.CreatedAt = timestamppb.New(c.CreatedAt.Time)
	}
	if c.UpdatedAt.Valid {
		pc.UpdatedAt = timestamppb.New(c.UpdatedAt.Time)
	}

	if pc.Tags == nil {
		pc.Tags = []string{}
	}

	return pc
}

// HealthCheck checks the health of the service
func (s *RankingsService) HealthCheck(
	ctx context.Context,
	req *connect.Request[gen.HealthCheckRequest],
) (*connect.Response[gen.HealthCheckResponse], error) {
	if err := s.db.Ping(ctx); err != nil {
		return connect.NewResponse(&gen.HealthCheckResponse{
			Status:   "unhealthy",
			Database: "disconnected",
		}), nil
	}

	return connect.NewResponse(&gen.HealthCheckResponse{
		Status:   "healthy",
		Database: "connected",
	}), nil
}

// GetStats returns platform statistics
func (s *RankingsService) GetStats(
	ctx context.Context,
	req *connect.Request[gen.GetStatsRequest],
) (*connect.Response[gen.GetStatsResponse], error) {
	totalCompanies, err := s.queries.CountCompanies(ctx)
	if err != nil {
		totalCompanies = 0
	}

	totalVotes, err := s.queries.CountVotes(ctx)
	if err != nil {
		totalVotes = 0
	}

	totalRatings, err := s.queries.CountRatings(ctx)
	if err != nil {
		totalRatings = 0
	}

	totalComments, err := s.queries.CountComments(ctx)
	if err != nil {
		totalComments = 0
	}

	return connect.NewResponse(&gen.GetStatsResponse{
		TotalCompanies: int32(totalCompanies),
		TotalVotes:     int32(totalVotes),
		TotalRatings:   int32(totalRatings),
		TotalComments:  int32(totalComments),
	}), nil
}

// ListCategories returns all categories with counts
func (s *RankingsService) ListCategories(
	ctx context.Context,
	req *connect.Request[gen.ListCategoriesRequest],
) (*connect.Response[gen.ListCategoriesResponse], error) {
	rows, err := s.queries.GetCategories(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	categories := make([]*gen.CategoryCount, len(rows))
	for i, row := range rows {
		categories[i] = &gen.CategoryCount{
			Category: row.Category,
			Count:    int32(row.Count),
		}
	}

	return connect.NewResponse(&gen.ListCategoriesResponse{
		Categories: categories,
	}), nil
}

// ListCompanies returns all companies with optional filtering
func (s *RankingsService) ListCompanies(
	ctx context.Context,
	req *connect.Request[gen.ListCompaniesRequest],
) (*connect.Response[gen.ListCompaniesResponse], error) {
	var companies []sqlc.Company
	var err error

	category := ""
	if req.Msg.Category != nil {
		category = *req.Msg.Category
	}
	search := ""
	if req.Msg.Search != nil {
		search = *req.Msg.Search
	}

	if category != "" && category != "all" {
		if search != "" {
			searchPattern := "%" + strings.ToLower(search) + "%"
			companies, err = s.queries.SearchCompaniesByCategory(ctx, sqlc.SearchCompaniesByCategoryParams{
				Category: category,
				Name:     searchPattern,
			})
		} else {
			companies, err = s.queries.ListCompaniesByCategory(ctx, category)
		}
	} else {
		if search != "" {
			searchPattern := "%" + strings.ToLower(search) + "%"
			companies, err = s.queries.SearchCompanies(ctx, searchPattern)
		} else {
			companies, err = s.queries.ListCompanies(ctx)
		}
	}

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoCompanies := make([]*gen.Company, len(companies))
	for i, c := range companies {
		protoCompanies[i] = companyToProto(c, int32(i+1))
	}

	return connect.NewResponse(&gen.ListCompaniesResponse{
		Companies: protoCompanies,
	}), nil
}

// GetCompany returns a single company by slug
func (s *RankingsService) GetCompany(
	ctx context.Context,
	req *connect.Request[gen.GetCompanyRequest],
) (*connect.Response[gen.GetCompanyResponse], error) {
	company, err := s.queries.GetCompanyBySlug(ctx, req.Msg.Slug)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	rank, err := s.queries.GetCompanyRank(ctx, company.EloRating)
	if err != nil {
		rank = 0
	}

	return connect.NewResponse(&gen.GetCompanyResponse{
		Company: companyToProto(company, int32(rank)),
	}), nil
}

// GetMatchup returns a random matchup pair
func (s *RankingsService) GetMatchup(
	ctx context.Context,
	req *connect.Request[gen.GetMatchupRequest],
) (*connect.Response[gen.GetMatchupResponse], error) {
	var companies []sqlc.Company
	var err error

	category := ""
	if req.Msg.Category != nil {
		category = *req.Msg.Category
	}

	if category != "" && category != "all" {
		companies, err = s.queries.GetRandomMatchupByCategory(ctx, category)
	} else {
		companies, err = s.queries.GetRandomMatchup(ctx)
	}

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if len(companies) < 2 {
		return nil, connect.NewError(connect.CodeNotFound, nil)
	}

	// Randomize order
	if rand.Float32() > 0.5 {
		companies[0], companies[1] = companies[1], companies[0]
	}

	return connect.NewResponse(&gen.GetMatchupResponse{
		Company1: companyToProto(companies[0], 0),
		Company2: companyToProto(companies[1], 0),
	}), nil
}

// SubmitVote processes a vote
func (s *RankingsService) SubmitVote(
	ctx context.Context,
	req *connect.Request[gen.SubmitVoteRequest],
) (*connect.Response[gen.SubmitVoteResponse], error) {
	if req.Msg.WinnerId == req.Msg.LoserId {
		return nil, connect.NewError(connect.CodeInvalidArgument, nil)
	}

	// Get current ELO ratings
	winnerElo, err := s.queries.GetCompanyEloRating(ctx, req.Msg.WinnerId)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	loserElo, err := s.queries.GetCompanyEloRating(ctx, req.Msg.LoserId)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	// Calculate new ELO ratings
	kFactor := 32.0
	expectedWinner := 1.0 / (1.0 + math.Pow(10, float64(loserElo-winnerElo)/400))
	expectedLoser := 1.0 - expectedWinner

	newWinnerElo := int32(float64(winnerElo) + kFactor*(1-expectedWinner))
	newLoserElo := int32(float64(loserElo) + kFactor*(0-expectedLoser))

	winnerEloDiff := newWinnerElo - winnerElo
	loserEloDiff := newLoserElo - loserElo

	// Update companies
	if err := s.queries.UpdateCompanyAfterWin(ctx, sqlc.UpdateCompanyAfterWinParams{
		ID:        req.Msg.WinnerId,
		EloRating: newWinnerElo,
	}); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if err := s.queries.UpdateCompanyAfterLoss(ctx, sqlc.UpdateCompanyAfterLossParams{
		ID:        req.Msg.LoserId,
		EloRating: newLoserElo,
	}); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// Record vote
	sessionID := req.Msg.SessionId
	var userID *string
	if req.Msg.UserId != nil {
		userID = req.Msg.UserId
	}
	s.queries.CreateVote(ctx, sqlc.CreateVoteParams{
		WinnerID:  req.Msg.WinnerId,
		LoserID:   req.Msg.LoserId,
		SessionID: &sessionID,
		UserID:    userID,
	})

	// Get updated companies
	winner, _ := s.queries.GetCompanyByID(ctx, req.Msg.WinnerId)
	loser, _ := s.queries.GetCompanyByID(ctx, req.Msg.LoserId)

	return connect.NewResponse(&gen.SubmitVoteResponse{
		Winner:        companyToProto(winner, 0),
		Loser:         companyToProto(loser, 0),
		WinnerEloDiff: winnerEloDiff,
		LoserEloDiff:  loserEloDiff,
	}), nil
}

// GetLeaderboard returns the leaderboard
func (s *RankingsService) GetLeaderboard(
	ctx context.Context,
	req *connect.Request[gen.GetLeaderboardRequest],
) (*connect.Response[gen.GetLeaderboardResponse], error) {
	page := req.Msg.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.Msg.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 25
	}
	offset := (page - 1) * pageSize

	var companies []sqlc.Company
	var totalCount int64
	var err error

	category := ""
	if req.Msg.Category != nil {
		category = *req.Msg.Category
	}

	if category != "" && category != "all" {
		companies, err = s.queries.GetLeaderboardByCategory(ctx, sqlc.GetLeaderboardByCategoryParams{
			Category: category,
			Limit:    pageSize,
			Offset:   offset,
		})
		if err == nil {
			totalCount, _ = s.queries.CountCompaniesByCategory(ctx, category)
		}
	} else {
		companies, err = s.queries.GetLeaderboard(ctx, sqlc.GetLeaderboardParams{
			Limit:  pageSize,
			Offset: offset,
		})
		if err == nil {
			totalCount, _ = s.queries.CountCompanies(ctx)
		}
	}

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoCompanies := make([]*gen.Company, len(companies))
	for i, c := range companies {
		protoCompanies[i] = companyToProto(c, int32(offset)+int32(i)+1)
	}

	return connect.NewResponse(&gen.GetLeaderboardResponse{
		Companies:  protoCompanies,
		TotalCount: int32(totalCount),
		Page:       page,
		PageSize:   pageSize,
	}), nil
}

// GetUserLeaderboard returns the user leaderboard ranked by total votes
func (s *RankingsService) GetUserLeaderboard(
	ctx context.Context,
	req *connect.Request[gen.GetUserLeaderboardRequest],
) (*connect.Response[gen.GetUserLeaderboardResponse], error) {
	page := req.Msg.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.Msg.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 25
	}
	offset := (page - 1) * pageSize

	users, err := s.queries.GetUserLeaderboard(ctx, sqlc.GetUserLeaderboardParams{
		Limit:  pageSize,
		Offset: offset,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	totalCount, err := s.queries.CountUsersWithVotes(ctx)
	if err != nil {
		totalCount = 0
	}

	protoUsers := make([]*gen.UserLeaderboardEntry, len(users))
	for i, u := range users {
		userId := ""
		if u.UserID != nil {
			userId = *u.UserID
		}
		protoUsers[i] = &gen.UserLeaderboardEntry{
			UserId:     userId,
			TotalVotes: int32(u.TotalVotes),
			Rank:       int32(offset) + int32(i) + 1,
		}
	}

	return connect.NewResponse(&gen.GetUserLeaderboardResponse{
		Users:      protoUsers,
		TotalCount: int32(totalCount),
		Page:       page,
		PageSize:   pageSize,
	}), nil
}

// SubmitRating submits a rating for a company
func (s *RankingsService) SubmitRating(
	ctx context.Context,
	req *connect.Request[gen.SubmitRatingRequest],
) (*connect.Response[gen.SubmitRatingResponse], error) {
	if req.Msg.Score < 1 || req.Msg.Score > 5 {
		return nil, connect.NewError(connect.CodeInvalidArgument, nil)
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
	if !validCriteria[req.Msg.Criterion] {
		return nil, connect.NewError(connect.CodeInvalidArgument, nil)
	}

	exists, err := s.queries.CompanyExists(ctx, req.Msg.CompanyId)
	if err != nil || !exists {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	sessionID := req.Msg.SessionId
	rating, err := s.queries.CreateRating(ctx, sqlc.CreateRatingParams{
		CompanyID: req.Msg.CompanyId,
		Criterion: req.Msg.Criterion,
		Score:     req.Msg.Score,
		SessionID: &sessionID,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoRating := &gen.CompanyRating{
		Id:        rating.ID,
		CompanyId: rating.CompanyID,
		Criterion: rating.Criterion,
		Score:     rating.Score,
	}
	if rating.SessionID != nil {
		protoRating.SessionId = rating.SessionID
	}
	if rating.CreatedAt.Valid {
		protoRating.CreatedAt = timestamppb.New(rating.CreatedAt.Time)
	}

	return connect.NewResponse(&gen.SubmitRatingResponse{
		Rating: protoRating,
	}), nil
}

// GetCompanyRatings returns aggregated ratings for a company
func (s *RankingsService) GetCompanyRatings(
	ctx context.Context,
	req *connect.Request[gen.GetCompanyRatingsRequest],
) (*connect.Response[gen.GetCompanyRatingsResponse], error) {
	companyID, err := s.queries.GetCompanyIDBySlug(ctx, req.Msg.Slug)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	rows, err := s.queries.GetAggregatedRatings(ctx, companyID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	ratings := make([]*gen.AggregatedRating, len(rows))
	for i, row := range rows {
		ratings[i] = &gen.AggregatedRating{
			Criterion:    row.Criterion,
			AverageScore: row.AverageScore,
			TotalRatings: int32(row.TotalRatings),
		}
	}

	return connect.NewResponse(&gen.GetCompanyRatingsResponse{
		Ratings: ratings,
	}), nil
}

// SubmitComment submits a comment for a company
func (s *RankingsService) SubmitComment(
	ctx context.Context,
	req *connect.Request[gen.SubmitCommentRequest],
) (*connect.Response[gen.SubmitCommentResponse], error) {
	content := strings.TrimSpace(req.Msg.Content)
	if content == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, nil)
	}
	if len(content) > 2000 {
		return nil, connect.NewError(connect.CodeInvalidArgument, nil)
	}

	exists, err := s.queries.CompanyExists(ctx, req.Msg.CompanyId)
	if err != nil || !exists {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	sessionID := req.Msg.SessionId
	comment, err := s.queries.CreateComment(ctx, sqlc.CreateCommentParams{
		CompanyID:         req.Msg.CompanyId,
		Content:           content,
		IsCurrentEmployee: &req.Msg.IsCurrentEmployee,
		SessionID:         &sessionID,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoComment := &gen.CompanyComment{
		Id:        comment.ID,
		CompanyId: comment.CompanyID,
		Content:   comment.Content,
		Upvotes:   comment.Upvotes,
	}
	if comment.IsCurrentEmployee != nil {
		protoComment.IsCurrentEmployee = *comment.IsCurrentEmployee
	}
	if comment.SessionID != nil {
		protoComment.SessionId = comment.SessionID
	}
	if comment.CreatedAt.Valid {
		protoComment.CreatedAt = timestamppb.New(comment.CreatedAt.Time)
	}

	return connect.NewResponse(&gen.SubmitCommentResponse{
		Comment: protoComment,
	}), nil
}

// GetCompanyComments returns comments for a company
func (s *RankingsService) GetCompanyComments(
	ctx context.Context,
	req *connect.Request[gen.GetCompanyCommentsRequest],
) (*connect.Response[gen.GetCompanyCommentsResponse], error) {
	companyID, err := s.queries.GetCompanyIDBySlug(ctx, req.Msg.Slug)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	rows, err := s.queries.GetCompanyComments(ctx, companyID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	comments := make([]*gen.CompanyComment, len(rows))
	for i, row := range rows {
		comments[i] = &gen.CompanyComment{
			Id:        row.ID,
			CompanyId: row.CompanyID,
			Content:   row.Content,
			Upvotes:   row.Upvotes,
		}
		if row.IsCurrentEmployee != nil {
			comments[i].IsCurrentEmployee = *row.IsCurrentEmployee
		}
		if row.SessionID != nil {
			comments[i].SessionId = row.SessionID
		}
		if row.CreatedAt.Valid {
			comments[i].CreatedAt = timestamppb.New(row.CreatedAt.Time)
		}
	}

	return connect.NewResponse(&gen.GetCompanyCommentsResponse{
		Comments: comments,
	}), nil
}

// UpvoteComment upvotes a comment
func (s *RankingsService) UpvoteComment(
	ctx context.Context,
	req *connect.Request[gen.UpvoteCommentRequest],
) (*connect.Response[gen.UpvoteCommentResponse], error) {
	comment, err := s.queries.UpvoteComment(ctx, req.Msg.CommentId)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	protoComment := &gen.CompanyComment{
		Id:        comment.ID,
		CompanyId: comment.CompanyID,
		Content:   comment.Content,
		Upvotes:   comment.Upvotes,
	}
	if comment.IsCurrentEmployee != nil {
		protoComment.IsCurrentEmployee = *comment.IsCurrentEmployee
	}
	if comment.SessionID != nil {
		protoComment.SessionId = comment.SessionID
	}
	if comment.CreatedAt.Valid {
		protoComment.CreatedAt = timestamppb.New(comment.CreatedAt.Time)
	}

	return connect.NewResponse(&gen.UpvoteCommentResponse{
		Comment: protoComment,
	}), nil
}
