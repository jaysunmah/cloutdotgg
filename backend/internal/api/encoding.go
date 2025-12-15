package api

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/cloutdotgg/backend/internal/pb"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

const (
	ContentTypeJSON     = "application/json"
	ContentTypeProtobuf = "application/x-protobuf"
)

// wantsProtobuf checks if the client prefers protobuf response
func wantsProtobuf(r *http.Request) bool {
	accept := r.Header.Get("Accept")
	return strings.Contains(accept, ContentTypeProtobuf)
}

// isProtobufRequest checks if the request body is protobuf
func isProtobufRequest(r *http.Request) bool {
	contentType := r.Header.Get("Content-Type")
	return strings.Contains(contentType, ContentTypeProtobuf)
}

// respondProto writes a protobuf response
func respondProto(w http.ResponseWriter, status int, msg proto.Message) {
	data, err := proto.Marshal(msg)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to encode protobuf response")
		return
	}
	w.Header().Set("Content-Type", ContentTypeProtobuf)
	w.WriteHeader(status)
	w.Write(data)
}

// decodeProtoRequest decodes a protobuf request body
func decodeProtoRequest(r *http.Request, msg proto.Message) error {
	data, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	return proto.Unmarshal(data, msg)
}

// respond writes either JSON or protobuf response based on Accept header
func respond(w http.ResponseWriter, r *http.Request, status int, jsonData any, protoMsg proto.Message) {
	if wantsProtobuf(r) && protoMsg != nil {
		respondProto(w, status, protoMsg)
	} else {
		respondJSON(w, status, jsonData)
	}
}

// decodeRequest decodes either JSON or protobuf request based on Content-Type
func decodeRequest(r *http.Request, jsonData any, protoMsg proto.Message) error {
	if isProtobufRequest(r) && protoMsg != nil {
		return decodeProtoRequest(r, protoMsg)
	}
	return json.NewDecoder(r.Body).Decode(jsonData)
}

// Conversion helpers: Go types to Protobuf

// CompanyToProto converts a Company struct to protobuf
func CompanyToProto(c *Company) *pb.Company {
	pc := &pb.Company{
		Id:         int32(c.ID),
		Name:       c.Name,
		Slug:       c.Slug,
		Category:   c.Category,
		Tags:       c.Tags,
		EloRating:  int32(c.EloRating),
		TotalVotes: int32(c.TotalVotes),
		Wins:       int32(c.Wins),
		Losses:     int32(c.Losses),
		Rank:       int32(c.Rank),
		CreatedAt:  timestamppb.New(c.CreatedAt),
		UpdatedAt:  timestamppb.New(c.UpdatedAt),
	}

	if c.LogoURL != nil {
		pc.LogoUrl = wrapperspb.String(*c.LogoURL)
	}
	if c.Description != nil {
		pc.Description = wrapperspb.String(*c.Description)
	}
	if c.Website != nil {
		pc.Website = wrapperspb.String(*c.Website)
	}
	if c.FoundedYear != nil {
		pc.FoundedYear = wrapperspb.Int32(int32(*c.FoundedYear))
	}
	if c.HQLocation != nil {
		pc.HqLocation = wrapperspb.String(*c.HQLocation)
	}
	if c.EmployeeRange != nil {
		pc.EmployeeRange = wrapperspb.String(*c.EmployeeRange)
	}
	if c.FundingStage != nil {
		pc.FundingStage = wrapperspb.String(*c.FundingStage)
	}

	if pc.Tags == nil {
		pc.Tags = []string{}
	}

	return pc
}

// CompanyFromProto converts a protobuf Company to struct
func CompanyFromProto(pc *pb.Company) *Company {
	c := &Company{
		ID:         int(pc.Id),
		Name:       pc.Name,
		Slug:       pc.Slug,
		Category:   pc.Category,
		Tags:       pc.Tags,
		EloRating:  int(pc.EloRating),
		TotalVotes: int(pc.TotalVotes),
		Wins:       int(pc.Wins),
		Losses:     int(pc.Losses),
		Rank:       int(pc.Rank),
	}

	if pc.CreatedAt != nil {
		c.CreatedAt = pc.CreatedAt.AsTime()
	}
	if pc.UpdatedAt != nil {
		c.UpdatedAt = pc.UpdatedAt.AsTime()
	}
	if pc.LogoUrl != nil {
		c.LogoURL = &pc.LogoUrl.Value
	}
	if pc.Description != nil {
		c.Description = &pc.Description.Value
	}
	if pc.Website != nil {
		c.Website = &pc.Website.Value
	}
	if pc.FoundedYear != nil {
		v := int(pc.FoundedYear.Value)
		c.FoundedYear = &v
	}
	if pc.HqLocation != nil {
		c.HQLocation = &pc.HqLocation.Value
	}
	if pc.EmployeeRange != nil {
		c.EmployeeRange = &pc.EmployeeRange.Value
	}
	if pc.FundingStage != nil {
		c.FundingStage = &pc.FundingStage.Value
	}

	if c.Tags == nil {
		c.Tags = []string{}
	}

	return c
}

// CompaniesToProto converts a slice of Company to protobuf CompanyList
func CompaniesToProto(companies []Company) *pb.CompanyList {
	pbCompanies := make([]*pb.Company, len(companies))
	for i := range companies {
		pbCompanies[i] = CompanyToProto(&companies[i])
	}
	return &pb.CompanyList{Companies: pbCompanies}
}

// VoteRequestFromProto converts protobuf VoteRequest to struct
func VoteRequestFromProto(pv *pb.VoteRequest) *VoteRequest {
	return &VoteRequest{
		WinnerID:  int(pv.WinnerId),
		LoserID:   int(pv.LoserId),
		SessionID: pv.SessionId,
	}
}

// VoteResponseToProto converts VoteResponse to protobuf
func VoteResponseToProto(vr *VoteResponse) *pb.VoteResponse {
	return &pb.VoteResponse{
		Winner:        CompanyToProto(&vr.Winner),
		Loser:         CompanyToProto(&vr.Loser),
		WinnerEloDiff: int32(vr.WinnerEloDiff),
		LoserEloDiff:  int32(vr.LoserEloDiff),
	}
}

// MatchupPairToProto converts MatchupPair to protobuf
func MatchupPairToProto(mp *MatchupPair) *pb.MatchupPair {
	return &pb.MatchupPair{
		Company1: CompanyToProto(&mp.Company1),
		Company2: CompanyToProto(&mp.Company2),
	}
}

// LeaderboardResponseToProto converts LeaderboardResponse to protobuf
func LeaderboardResponseToProto(lr *LeaderboardResponse) *pb.LeaderboardResponse {
	pbCompanies := make([]*pb.Company, len(lr.Companies))
	for i := range lr.Companies {
		pbCompanies[i] = CompanyToProto(&lr.Companies[i])
	}
	return &pb.LeaderboardResponse{
		Companies:  pbCompanies,
		TotalCount: int32(lr.TotalCount),
		Page:       int32(lr.Page),
		PageSize:   int32(lr.PageSize),
	}
}

// StatsResponseToProto converts StatsResponse to protobuf
func StatsResponseToProto(sr *StatsResponse) *pb.StatsResponse {
	return &pb.StatsResponse{
		TotalCompanies: int32(sr.TotalCompanies),
		TotalVotes:     int32(sr.TotalVotes),
		TotalRatings:   int32(sr.TotalRatings),
		TotalComments:  int32(sr.TotalComments),
		Categories:     sr.Categories,
	}
}

// RatingRequestFromProto converts protobuf RatingRequest to struct
func RatingRequestFromProto(pr *pb.RatingRequest) *RatingRequest {
	return &RatingRequest{
		CompanyID: int(pr.CompanyId),
		Criterion: pr.Criterion,
		Score:     int(pr.Score),
		SessionID: pr.SessionId,
	}
}

// CompanyRatingToProto converts CompanyRating to protobuf
func CompanyRatingToProto(cr *CompanyRating) *pb.CompanyRating {
	pcr := &pb.CompanyRating{
		Id:        int32(cr.ID),
		CompanyId: int32(cr.CompanyID),
		Criterion: cr.Criterion,
		Score:     int32(cr.Score),
		CreatedAt: timestamppb.New(cr.CreatedAt),
	}
	if cr.SessionID != nil {
		pcr.SessionId = wrapperspb.String(*cr.SessionID)
	}
	return pcr
}

// AggregatedRatingToProto converts AggregatedRating to protobuf
func AggregatedRatingToProto(ar *AggregatedRating) *pb.AggregatedRating {
	return &pb.AggregatedRating{
		Criterion:    ar.Criterion,
		AverageScore: ar.AverageScore,
		TotalRatings: int32(ar.TotalRatings),
	}
}

// AggregatedRatingsToProto converts a slice of AggregatedRating to protobuf
func AggregatedRatingsToProto(ratings []AggregatedRating) *pb.AggregatedRatingList {
	pbRatings := make([]*pb.AggregatedRating, len(ratings))
	for i := range ratings {
		pbRatings[i] = AggregatedRatingToProto(&ratings[i])
	}
	return &pb.AggregatedRatingList{Ratings: pbRatings}
}

// CommentRequestFromProto converts protobuf CommentRequest to struct
func CommentRequestFromProto(pc *pb.CommentRequest) *CommentRequest {
	return &CommentRequest{
		CompanyID:         int(pc.CompanyId),
		Content:           pc.Content,
		IsCurrentEmployee: pc.IsCurrentEmployee,
		SessionID:         pc.SessionId,
	}
}

// CompanyCommentToProto converts CompanyComment to protobuf
func CompanyCommentToProto(cc *CompanyComment) *pb.CompanyComment {
	pcc := &pb.CompanyComment{
		Id:                int32(cc.ID),
		CompanyId:         int32(cc.CompanyID),
		Content:           cc.Content,
		IsCurrentEmployee: cc.IsCurrentEmployee,
		Upvotes:           int32(cc.Upvotes),
		CreatedAt:         timestamppb.New(cc.CreatedAt),
	}
	if cc.SessionID != nil {
		pcc.SessionId = wrapperspb.String(*cc.SessionID)
	}
	return pcc
}

// CompanyCommentsToProto converts a slice of CompanyComment to protobuf
func CompanyCommentsToProto(comments []CompanyComment) *pb.CommentList {
	pbComments := make([]*pb.CompanyComment, len(comments))
	for i := range comments {
		pbComments[i] = CompanyCommentToProto(&comments[i])
	}
	return &pb.CommentList{Comments: pbComments}
}

// CategoryCountToProto converts a category count to protobuf
func CategoryCountToProto(category string, count int) *pb.CategoryCount {
	return &pb.CategoryCount{
		Category: category,
		Count:    int32(count),
	}
}

// HealthResponseToProto converts health response to protobuf
func HealthResponseToProto(status, database string) *pb.HealthResponse {
	return &pb.HealthResponse{
		Status:   status,
		Database: database,
	}
}

// ErrorResponseToProto converts error response to protobuf
func ErrorResponseToProto(message string) *pb.ErrorResponse {
	return &pb.ErrorResponse{
		Error: message,
	}
}

// respondErrorWithProto writes an error response in JSON or protobuf format
func respondErrorWithProto(w http.ResponseWriter, r *http.Request, status int, message string) {
	if wantsProtobuf(r) {
		respondProto(w, status, ErrorResponseToProto(message))
	} else {
		respondError(w, status, message)
	}
}

// Helper to get nullable string
func getNullableString(s *wrapperspb.StringValue) *string {
	if s == nil {
		return nil
	}
	return &s.Value
}

// Helper to get nullable int
func getNullableInt32(i *wrapperspb.Int32Value) *int {
	if i == nil {
		return nil
	}
	v := int(i.Value)
	return &v
}

// Helper to get time from timestamp
func getTime(t *timestamppb.Timestamp) time.Time {
	if t == nil {
		return time.Time{}
	}
	return t.AsTime()
}
