FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates postgresql-client
WORKDIR /app

COPY --from=builder /app/server .
COPY migrations/ ./migrations/
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 8080
CMD ["./start.sh"]

