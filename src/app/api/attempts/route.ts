import sql from "@/lib/db";
import { verifyNonce } from "@/lib/nonce";
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
  const body = await request.json();

  const toolCall = body.message.toolCallList[0];
  const args = JSON.parse(toolCall.function.arguments);
  const userId = await verifyNonce(args.nonce);
  const { interviewId } = args;

  try {
    await sql`
      INSERT INTO interview_attempts (interview_id, user_id)
      VALUES (${interviewId}, ${userId})
    `;

    return Response.json({
      results: [{ toolCallId: toolCall.id, result: "Attempt saved successfully" }],
    });
  } catch (error) {
    console.error("Failed to save attempt:", error);
    return Response.json({
      results: [{ toolCallId: toolCall.id, result: "Failed to save attempt" }],
    }, { status: 500 });
  }
}
