package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"connectrpc.com/connect"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"github.com/cloutdotgg/backend/internal/db"
	"github.com/cloutdotgg/backend/internal/gen/genconnect"
	"github.com/cloutdotgg/backend/internal/service"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists (for local dev)
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	// Get configuration from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
	}

	// Initialize database connection
	pool, err := db.NewPool(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Connected to database")

	// Create rankings service
	rankingsService := service.NewRankingsService(pool)

	// Create Connect handler
	mux := http.NewServeMux()

	// Register Connect service
	path, handler := genconnect.NewRankingsServiceHandler(
		rankingsService,
		connect.WithInterceptors(),
	)
	mux.Handle(path, handler)

	// Add health check endpoint (REST fallback)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte(`{"status":"unhealthy","database":"disconnected"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy","database":"connected"}`))
	})

	// CORS configuration
	corsHandler := cors.New(cors.Options{
		AllowOriginFunc: func(origin string) bool {
			// Allow localhost for development
			if origin == "http://localhost:3000" {
				return true
			}
			// Allow custom domain
			if origin == "https://cloutdotgg.com" ||
				origin == "https://app.cloutdotgg.com" {
				return true
			}
			// Allow Railway and Vercel deployments
			if strings.HasSuffix(origin, ".railway.app") ||
				strings.HasSuffix(origin, ".up.railway.app") ||
				strings.HasSuffix(origin, ".vercel.app") {
				return true
			}
			return false
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"Accept",
			"Accept-Encoding",
			"Authorization",
			"Connect-Protocol-Version",
			"Connect-Timeout-Ms",
			"Content-Encoding",
			"Content-Type",
			"Grpc-Timeout",
			"X-Grpc-Web",
			"X-User-Agent",
		},
		ExposedHeaders: []string{
			"Connect-Content-Encoding",
			"Connect-Protocol-Version",
			"Grpc-Message",
			"Grpc-Status",
			"Grpc-Status-Details-Bin",
		},
		AllowCredentials: true,
		MaxAge:           7200,
	})

	// Wrap with CORS and HTTP/2 support
	h2cHandler := h2c.NewHandler(corsHandler.Handler(mux), &http2.Server{})

	// Create HTTP server
	httpServer := &http.Server{
		Addr:         ":" + port,
		Handler:      h2cHandler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Connect server starting on http://localhost:%s", port)
		log.Printf("Service available at http://localhost:%s%s", port, path)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}
