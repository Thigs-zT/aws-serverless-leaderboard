import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        const { game_id, player_id, player_name, score } = body || {};

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
                updated_at: new Date().toISOString()
            }
        });

        await docClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Score registered successfully",
                player: player_name,
                score: score
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message }),
        };
    }
};