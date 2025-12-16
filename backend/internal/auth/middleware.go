package auth

import (
	"context"
	"errors"
	"log"
	"strings"

	"connectrpc.com/connect"
	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

// User represents the authenticated user from the JWT
type User struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// userContextKey is the context key for storing user info
type userContextKey struct{}

// JWTValidator validates Auth0 JWTs
type JWTValidator struct {
	jwks     keyfunc.Keyfunc
	audience string
	issuer   string
}

// NewJWTValidator creates a new JWT validator for Auth0
func NewJWTValidator(domain, audience string) (*JWTValidator, error) {
	jwksURL := "https://" + domain + "/.well-known/jwks.json"

	// Create the keyfunc for verifying JWTs
	k, err := keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		return nil, err
	}

	return &JWTValidator{
		jwks:     k,
		audience: audience,
		issuer:   "https://" + domain + "/",
	}, nil
}

// Close cleans up the validator resources
func (v *JWTValidator) Close() {
	// keyfunc v3 uses context for lifecycle management, no explicit close needed
}

// ValidateToken validates a JWT and returns the user claims
func (v *JWTValidator) ValidateToken(tokenString string) (*User, error) {
	token, err := jwt.Parse(tokenString, v.jwks.Keyfunc,
		jwt.WithAudience(v.audience),
		jwt.WithIssuer(v.issuer),
	)
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}

	user := &User{
		Sub: claims["sub"].(string),
	}

	if email, ok := claims["email"].(string); ok {
		user.Email = email
	}
	if name, ok := claims["name"].(string); ok {
		user.Name = name
	}

	return user, nil
}

// AuthInterceptor creates a Connect interceptor for JWT validation
// If required is true, unauthenticated requests will be rejected
// If required is false, the user will be added to context if present but requests will proceed without auth
func (v *JWTValidator) AuthInterceptor(required bool) connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			// Extract token from Authorization header
			authHeader := req.Header().Get("Authorization")
			if authHeader == "" {
				if required {
					return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("missing authorization header"))
				}
				return next(ctx, req)
			}

			// Parse Bearer token
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				if required {
					return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("invalid authorization header"))
				}
				return next(ctx, req)
			}

			// Validate token
			user, err := v.ValidateToken(parts[1])
			if err != nil {
				log.Printf("JWT validation error: %v", err)
				if required {
					return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("invalid token"))
				}
				return next(ctx, req)
			}

			// Add user to context
			ctx = context.WithValue(ctx, userContextKey{}, user)
			return next(ctx, req)
		}
	}
}

// UserFromContext extracts the user from the context
func UserFromContext(ctx context.Context) *User {
	user, _ := ctx.Value(userContextKey{}).(*User)
	return user
}

// RequireAuth is a helper that returns an error if no user is in context
func RequireAuth(ctx context.Context) (*User, error) {
	user := UserFromContext(ctx)
	if user == nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("authentication required"))
	}
	return user, nil
}
