import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const game_id = event.queryStringParameters?.game_id;

    if (!game_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required query parameter: game_id" }),
      };
    }

    const command = new QueryCommand({
      TableName: "GameScores",
      IndexName: "GameScoreIndex", // Aponta para o GSI que criamos
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `GAME#${game_id}`,
      },
      ScanIndexForward: false, // false = Ordem DECRESCENTE (maior pontuação primeiro)
      Limit: 10, // Traz direto os 10 primeiros sem gastar RAM na Lambda!
    });

    const response = await docClient.send(command);

    // Higieniza a resposta (remove PK/SK e formata para o cliente)
    const leaderboard = (response.Items || []).map((item) => ({
      player_id: item.SK.replace("PLAYER#", ""),
      player_name: item.player_name || "Anonymous",
      score: item.score,
      updated_at: item.updated_at,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: game_id,
        leaderboard: leaderboard,
      }),
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};