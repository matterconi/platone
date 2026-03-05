import sql from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const interviewId = request.nextUrl.searchParams.get("interviewId");
  if (!interviewId) return Response.json({ success: false, error: "Missing interviewId" }, { status: 400 });

  try {
    const attempts = await sql`
      SELECT * FROM interview_attempts WHERE interview_id = ${interviewId} ORDER BY created_at DESC
    `;
    return Response.json({ success: true, data: attempts });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Failed to fetch attempts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let toolCallId: string | undefined;

  try {
    const secret = request.headers.get("x-vapi-secret");
    if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const toolCall = body.message.toolCallList[0];
    toolCallId = toolCall.id;

    const rawArgs = toolCall.function.arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    const userId: string = args.userId;
    const { interviewId } = args;
    if (!userId || !interviewId) throw new Error("Missing userId or interviewId");

    await sql`
      INSERT INTO interview_attempts (interview_id, user_id)
      VALUES (${interviewId}, ${userId})
    `;

    return Response.json({
      results: [{ toolCallId, result: "Attempt saved successfully" }],
    });
  } catch (error) {
    console.error("Failed to save attempt:", error);
    return Response.json({
      results: [{ toolCallId, result: "Failed to save attempt" }],
    }, { status: 500 });
  }
}
