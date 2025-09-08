import OpenAI from "openai";
import type { Athlete, Team, AthletePerformance } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateAthleteMessage(
  athlete: Athlete,
  recentPerformance: any,
  seasonStats: { wins: number; losses: number; pins: number },
  teamBrandVoice?: string
): Promise<string> {
  try {
    const prompt = `Generate a personalized, encouraging message for a wrestling athlete based on their recent performance and season statistics. The message should be positive, supportive, and highlight their achievements while encouraging continued improvement.

Athlete Information:
- Name: ${athlete.name}
- Grade: ${athlete.grade}
- Weight Class: ${athlete.weightClass}

Recent Performance:
${JSON.stringify(recentPerformance)}

Season Statistics:
- Wins: ${seasonStats.wins}
- Losses: ${seasonStats.losses}
- Pins: ${seasonStats.pins}

Team Brand Voice: ${teamBrandVoice || "Encouraging and supportive"}

Requirements:
- Keep the message between 50-100 words
- Focus on positive aspects and achievements
- Minimize focus on losses
- Include specific performance details when available
- Match the team's brand voice
- Be encouraging and motivational

Respond with JSON in this format: { "message": "your generated message" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an experienced wrestling coach who writes personalized, encouraging messages for athletes. Your messages are always positive, specific, and motivational."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"message": "Great job this week!"}');
    return result.message;
  } catch (error) {
    console.error("Error generating athlete message:", error);
    throw new Error("Failed to generate athlete message: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function generateTeamMessage(
  team: Team,
  competitionName: string,
  teamPerformance: any
): Promise<string> {
  try {
    const prompt = `Generate an inspiring team message for a wrestling team based on their recent competition performance. The message should celebrate the team's efforts, highlight key achievements, and motivate continued excellence.

Team Information:
- Team Name: ${team.name}
- School: ${team.school}
- Brand Voice: ${team.brandVoice || "Encouraging and supportive"}

Competition: ${competitionName}

Team Performance Summary:
${JSON.stringify(teamPerformance)}

Requirements:
- Keep the message between 100-150 words
- Celebrate team effort and individual achievements
- Maintain an encouraging and positive tone
- Highlight specific accomplishments when available
- Match the team's brand voice
- Include a motivational call to action for future competitions

Respond with JSON in this format: { "message": "your generated message" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an experienced wrestling coach who writes inspiring team messages. Your messages celebrate achievements, build team spirit, and motivate continued excellence."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"message": "Great team effort this week!"}');
    return result.message;
  } catch (error) {
    console.error("Error generating team message:", error);
    throw new Error("Failed to generate team message: " + (error instanceof Error ? error.message : String(error)));
  }
}
