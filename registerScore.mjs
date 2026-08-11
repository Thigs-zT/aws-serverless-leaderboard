import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const VALID_API_KEY = "zts-129c2WzkXLO"; 

export const handler = async (event) => {
  try {
    const clientApiKey = event.headers?.["x-api-key"] || event.headers?.["X-Api-Key"];

    if (!clientApiKey || clientApiKey !== VALID_API_KEY) {
      console.log("Acesso bloqueado: API Key inválida ou ausente.");
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Forbidden: Invalid or missing API Key" }),
      };
    }

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { game_id, player_id, player_name, score } = body;

    if (!game_id || !player_id || score === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: game_id, player_id, score" }),
      };
    }

    const command = new PutCommand({
      TableName: "GameScores",
      Item: {
        PK: `GAME#${game_id}`,
        SK: `PLAYER#${player_id}`,
        player_name: player_name || "Anonymous",
        score: Number(score),
        updated_at: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Score registered successfully!" }),
    };
  } catch (error) {
    console.error("Error registering score:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};