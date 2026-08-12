# Serverless Game Leaderboard API (AWS)

![Leaderboard API Architecture Diagram](./arquitetura_leaderboard.png)

A fully serverless, highly scalable, and cost-effective REST/HTTP API backend designed to manage leaderboards and player scores for digital games. Built using core AWS serverless services, this project implements a Single-Table Design pattern with Amazon DynamoDB, optimized query indexing, custom API Key protection, CloudWatch observability, and Infrastructure as Code (IaC) via AWS SAM.

## Architecture

The system uses a 100% serverless architecture deployed on AWS:

- **Amazon API Gateway (HTTP API v2):** Serves as the high-performance public entry point, routing requests to backend compute resources.
- **AWS Lambda (Node.js 18.x):** Executes stateless business logic for score ingestion, data validation, API key authentication, and leaderboard retrieval.
- **Amazon DynamoDB:** Stores player scores and game metadata using On-Demand capacity for zero idle cost and auto-scaling performance.
- **AWS SAM (Serverless Application Model):** Manages the entire cloud infrastructure declaratively using `template.yaml`.
- **Amazon CloudWatch:** Collects execution logs and metrics to monitor system health and latency.

## Database Design & Scalability (GSI)

The database utilizes Amazon DynamoDB with a Single-Table Design pattern optimized for large-scale queries:

- **Table Name:** `GameScores` (or `GameScores-SAM` via IaC)
- **Partition Key (`PK`):** `GAME#{game_id}` (e.g., `GAME#SpaceShooter_v1`)
- **Sort Key (`SK`):** `PLAYER#{player_id}` (e.g., `PLAYER#usr_1029`)
- **Attributes:** `player_name` (String), `score` (Number), `updated_at` (ISO Timestamp)

### Performance Optimization

To prevent high memory consumption and timeouts during sorting on large datasets, a **Global Secondary Index (GSI)** is configured:

- **Index Name:** `GameScoreIndex`
- **Index Partition Key:** `PK` (`S`)
- **Index Sort Key:** `score` (`N`)

This index allows direct, sorted queries from the database layer (`ScanIndexForward: false`), eliminating in-memory Array sorting inside the Lambda runtime.

## Security & Best Practices

- **API Key Ingestion Guard:** The `POST /scores` endpoint validates an `x-api-key` request header directly in the compute layer, blocking unauthorized payloads with HTTP 403 Forbidden.
- **Data Sanitization:** DynamoDB partition and sort keys (`PK`/`SK`) are removed prior to sending response payloads to decouple database implementation details from client applications.
- **Least-Privilege IAM Policies:** Scoped execution roles grant Lambda functions precise access to DynamoDB tables and GSI indexes.
- **Cost Governance:** AWS Budgets configured with zero-spend threshold alerts ($0.01) to prevent unexpected billing.

## API Endpoints

### 1. Register Score

Registers or updates a player score for a given game ID.

- **Method:** `POST`
- **Path:** `/scores`
- **Headers:** `Content-Type: application/json`, `x-api-key: YOUR_CUSTOM_API_KEY`
- **Request Body:**

```json
{
  "game_id": "SpaceShooter_v1",
  "player_id": "usr_001",
  "player_name": "PlayerName",
  "score": 99999
}
```

Response (201 Created):

```json
{
  "message": "Score registered successfully!"
}
```

Response (403 Forbidden - Missing/Invalid Key):

```json
{
  "message": "Forbidden: Invalid or missing API Key"
}
```

### 2. Get Top Leaderboard

Retrieves the top ranking scores for a specific game sorted in descending order.

- **Method:** `GET`
- **Path:** `/scores?game_id=SpaceShooter_v1`

Response (200 OK):

```json
{
  "game_id": "SpaceShooter_v1",
  "leaderboard": [
    {
      "player_id": "usr_001",
      "player_name": "PlayerName",
      "score": 99999,
      "updated_at": "2026-08-12T02:42:30.787Z"
    }
  ]
}
```

## Infrastructure as Code (AWS SAM)

To build, test, and deploy this infrastructure automatically:

```bash
# Build the application
sam build

# Deploy to AWS (guided first-time setup)
sam deploy --guided

# Subsequent deploys
sam deploy
```

## Local Testing (PowerShell)

Register a Score (POST):

```powershell
$headers = @{
    "x-api-key" = "YOUR_CUSTOM_API_KEY"
}

$body = @{
    game_id     = "SpaceShooter_v1"
    player_id   = "usr_001"
    player_name = "PlayerName"
    score       = 99999
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://<API_URL>/scores" -Method POST -Headers $headers -ContentType "application/json" -Body $body
```

Fetch Leaderboard (GET):

```powershell
Invoke-RestMethod -Uri "https://<API_URL>/scores?game_id=SpaceShooter_v1"
```
