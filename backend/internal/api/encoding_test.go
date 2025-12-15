package api

import (
	"testing"
	"time"

	"github.com/cloutdotgg/backend/internal/pb"
	"google.golang.org/protobuf/proto"
)

func TestCompanyToProto(t *testing.T) {
	logoURL := "https://example.com/logo.png"
	description := "A great AI company"
	website := "https://example.com"
	foundedYear := 2020
	hqLocation := "San Francisco, CA"
	employeeRange := "100-500"
	fundingStage := "Series B"

	company := &Company{
		ID:            1,
		Name:          "Test Company",
		Slug:          "test-company",
		LogoURL:       &logoURL,
		Description:   &description,
		Website:       &website,
		Category:      "AI Research",
		Tags:          []string{"ai", "ml", "research"},
		FoundedYear:   &foundedYear,
		HQLocation:    &hqLocation,
		EmployeeRange: &employeeRange,
		FundingStage:  &fundingStage,
		EloRating:     1500,
		TotalVotes:    100,
		Wins:          60,
		Losses:        40,
		Rank:          1,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Convert to protobuf
	pbCompany := CompanyToProto(company)

	// Verify fields
	if pbCompany.Id != int32(company.ID) {
		t.Errorf("ID mismatch: got %d, want %d", pbCompany.Id, company.ID)
	}
	if pbCompany.Name != company.Name {
		t.Errorf("Name mismatch: got %s, want %s", pbCompany.Name, company.Name)
	}
	if pbCompany.Slug != company.Slug {
		t.Errorf("Slug mismatch: got %s, want %s", pbCompany.Slug, company.Slug)
	}
	if pbCompany.LogoUrl.GetValue() != *company.LogoURL {
		t.Errorf("LogoURL mismatch: got %s, want %s", pbCompany.LogoUrl.GetValue(), *company.LogoURL)
	}
	if pbCompany.Category != company.Category {
		t.Errorf("Category mismatch: got %s, want %s", pbCompany.Category, company.Category)
	}
	if len(pbCompany.Tags) != len(company.Tags) {
		t.Errorf("Tags length mismatch: got %d, want %d", len(pbCompany.Tags), len(company.Tags))
	}
	if pbCompany.EloRating != int32(company.EloRating) {
		t.Errorf("EloRating mismatch: got %d, want %d", pbCompany.EloRating, company.EloRating)
	}
}

func TestCompanyProtoRoundTrip(t *testing.T) {
	logoURL := "https://example.com/logo.png"
	description := "A great AI company"

	original := &Company{
		ID:          1,
		Name:        "Test Company",
		Slug:        "test-company",
		LogoURL:     &logoURL,
		Description: &description,
		Category:    "AI Research",
		Tags:        []string{"ai", "ml"},
		EloRating:   1500,
		TotalVotes:  100,
		Wins:        60,
		Losses:      40,
		Rank:        1,
		CreatedAt:   time.Now().UTC().Truncate(time.Microsecond),
		UpdatedAt:   time.Now().UTC().Truncate(time.Microsecond),
	}

	// Convert to proto
	pbCompany := CompanyToProto(original)

	// Serialize to bytes
	data, err := proto.Marshal(pbCompany)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.Company
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Convert back
	result := CompanyFromProto(&decoded)

	// Verify roundtrip
	if result.ID != original.ID {
		t.Errorf("ID mismatch after roundtrip: got %d, want %d", result.ID, original.ID)
	}
	if result.Name != original.Name {
		t.Errorf("Name mismatch after roundtrip: got %s, want %s", result.Name, original.Name)
	}
	if result.Slug != original.Slug {
		t.Errorf("Slug mismatch after roundtrip: got %s, want %s", result.Slug, original.Slug)
	}
	if *result.LogoURL != *original.LogoURL {
		t.Errorf("LogoURL mismatch after roundtrip: got %s, want %s", *result.LogoURL, *original.LogoURL)
	}
	if result.EloRating != original.EloRating {
		t.Errorf("EloRating mismatch after roundtrip: got %d, want %d", result.EloRating, original.EloRating)
	}
}

func TestVoteRequestProtoRoundTrip(t *testing.T) {
	original := &VoteRequest{
		WinnerID:  1,
		LoserID:   2,
		SessionID: "test-session-123",
	}

	// Create proto
	pbReq := &pb.VoteRequest{
		WinnerId:  int32(original.WinnerID),
		LoserId:   int32(original.LoserID),
		SessionId: original.SessionID,
	}

	// Serialize
	data, err := proto.Marshal(pbReq)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.VoteRequest
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Convert
	result := VoteRequestFromProto(&decoded)

	// Verify
	if result.WinnerID != original.WinnerID {
		t.Errorf("WinnerID mismatch: got %d, want %d", result.WinnerID, original.WinnerID)
	}
	if result.LoserID != original.LoserID {
		t.Errorf("LoserID mismatch: got %d, want %d", result.LoserID, original.LoserID)
	}
	if result.SessionID != original.SessionID {
		t.Errorf("SessionID mismatch: got %s, want %s", result.SessionID, original.SessionID)
	}
}

func TestLeaderboardResponseProto(t *testing.T) {
	companies := []Company{
		{ID: 1, Name: "Company 1", Slug: "company-1", Category: "AI", Tags: []string{}, EloRating: 1600, Rank: 1},
		{ID: 2, Name: "Company 2", Slug: "company-2", Category: "AI", Tags: []string{}, EloRating: 1550, Rank: 2},
	}

	lr := &LeaderboardResponse{
		Companies:  companies,
		TotalCount: 2,
		Page:       1,
		PageSize:   25,
	}

	// Convert to proto
	pbLr := LeaderboardResponseToProto(lr)

	// Serialize
	data, err := proto.Marshal(pbLr)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.LeaderboardResponse
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Verify
	if len(decoded.Companies) != len(companies) {
		t.Errorf("Companies length mismatch: got %d, want %d", len(decoded.Companies), len(companies))
	}
	if decoded.TotalCount != int32(lr.TotalCount) {
		t.Errorf("TotalCount mismatch: got %d, want %d", decoded.TotalCount, lr.TotalCount)
	}
	if decoded.Page != int32(lr.Page) {
		t.Errorf("Page mismatch: got %d, want %d", decoded.Page, lr.Page)
	}
}

func TestStatsResponseProto(t *testing.T) {
	stats := &StatsResponse{
		TotalCompanies: 50,
		TotalVotes:     1000,
		TotalRatings:   500,
		TotalComments:  100,
		Categories:     []string{"AI Research", "AI Infrastructure", "AI Applications"},
	}

	// Convert to proto
	pbStats := StatsResponseToProto(stats)

	// Serialize
	data, err := proto.Marshal(pbStats)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.StatsResponse
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Verify
	if decoded.TotalCompanies != int32(stats.TotalCompanies) {
		t.Errorf("TotalCompanies mismatch: got %d, want %d", decoded.TotalCompanies, stats.TotalCompanies)
	}
	if decoded.TotalVotes != int32(stats.TotalVotes) {
		t.Errorf("TotalVotes mismatch: got %d, want %d", decoded.TotalVotes, stats.TotalVotes)
	}
	if len(decoded.Categories) != len(stats.Categories) {
		t.Errorf("Categories length mismatch: got %d, want %d", len(decoded.Categories), len(stats.Categories))
	}
}

func TestMatchupPairProto(t *testing.T) {
	company1 := Company{ID: 1, Name: "Company 1", Slug: "company-1", Category: "AI", Tags: []string{}, EloRating: 1500}
	company2 := Company{ID: 2, Name: "Company 2", Slug: "company-2", Category: "AI", Tags: []string{}, EloRating: 1550}

	mp := &MatchupPair{
		Company1: company1,
		Company2: company2,
	}

	// Convert to proto
	pbMp := MatchupPairToProto(mp)

	// Serialize
	data, err := proto.Marshal(pbMp)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.MatchupPair
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Verify
	if decoded.Company1.Name != company1.Name {
		t.Errorf("Company1 name mismatch: got %s, want %s", decoded.Company1.Name, company1.Name)
	}
	if decoded.Company2.Name != company2.Name {
		t.Errorf("Company2 name mismatch: got %s, want %s", decoded.Company2.Name, company2.Name)
	}
}

func TestCommentProto(t *testing.T) {
	sessionID := "test-session"
	comment := &CompanyComment{
		ID:                1,
		CompanyID:         10,
		Content:           "Great company to work for!",
		IsCurrentEmployee: true,
		SessionID:         &sessionID,
		Upvotes:           5,
		CreatedAt:         time.Now().UTC().Truncate(time.Microsecond),
	}

	// Convert to proto
	pbComment := CompanyCommentToProto(comment)

	// Serialize
	data, err := proto.Marshal(pbComment)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.CompanyComment
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Verify
	if decoded.Id != int32(comment.ID) {
		t.Errorf("ID mismatch: got %d, want %d", decoded.Id, comment.ID)
	}
	if decoded.Content != comment.Content {
		t.Errorf("Content mismatch: got %s, want %s", decoded.Content, comment.Content)
	}
	if decoded.IsCurrentEmployee != comment.IsCurrentEmployee {
		t.Errorf("IsCurrentEmployee mismatch: got %v, want %v", decoded.IsCurrentEmployee, comment.IsCurrentEmployee)
	}
	if decoded.Upvotes != int32(comment.Upvotes) {
		t.Errorf("Upvotes mismatch: got %d, want %d", decoded.Upvotes, comment.Upvotes)
	}
}

func TestRatingProto(t *testing.T) {
	req := &RatingRequest{
		CompanyID: 1,
		Criterion: "compensation",
		Score:     5,
		SessionID: "test-session",
	}

	// Create proto
	pbReq := &pb.RatingRequest{
		CompanyId: int32(req.CompanyID),
		Criterion: req.Criterion,
		Score:     int32(req.Score),
		SessionId: req.SessionID,
	}

	// Serialize
	data, err := proto.Marshal(pbReq)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize
	var decoded pb.RatingRequest
	if err := proto.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Convert
	result := RatingRequestFromProto(&decoded)

	// Verify
	if result.CompanyID != req.CompanyID {
		t.Errorf("CompanyID mismatch: got %d, want %d", result.CompanyID, req.CompanyID)
	}
	if result.Criterion != req.Criterion {
		t.Errorf("Criterion mismatch: got %s, want %s", result.Criterion, req.Criterion)
	}
	if result.Score != req.Score {
		t.Errorf("Score mismatch: got %d, want %d", result.Score, req.Score)
	}
}

func BenchmarkCompanyProtoMarshal(b *testing.B) {
	logoURL := "https://example.com/logo.png"
	company := &Company{
		ID:        1,
		Name:      "Test Company",
		Slug:      "test-company",
		LogoURL:   &logoURL,
		Category:  "AI Research",
		Tags:      []string{"ai", "ml", "research"},
		EloRating: 1500,
	}

	pbCompany := CompanyToProto(company)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = proto.Marshal(pbCompany)
	}
}

func BenchmarkCompanyProtoUnmarshal(b *testing.B) {
	logoURL := "https://example.com/logo.png"
	company := &Company{
		ID:        1,
		Name:      "Test Company",
		Slug:      "test-company",
		LogoURL:   &logoURL,
		Category:  "AI Research",
		Tags:      []string{"ai", "ml", "research"},
		EloRating: 1500,
	}

	pbCompany := CompanyToProto(company)
	data, _ := proto.Marshal(pbCompany)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var decoded pb.Company
		_ = proto.Unmarshal(data, &decoded)
	}
}
