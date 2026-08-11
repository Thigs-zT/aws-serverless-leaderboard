import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const gameId = event.queryStringParameters?.game_id || "SpaceShooter_v1";

        const command = new QueryCommand({
            TableName: "GameScores",
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": `GAME#${gameId}`
            }
        });

        const response = await docClient.send(command);

        // Limpa e sanitiza os itens removendo as chaves internas PK e SK
        const leaderboard = (response.Items || [])
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => ({
                player_id: item.SK.replace("PLAYER#", ""),
                player_name: item.player_name,
                score: item.score,
                updated_at: item.updated_at
            }));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                game_id: gameId,
                leaderboard: leaderboard
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error fetching leaderboard", error: error.message }),
        };
    }
};