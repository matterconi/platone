import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, role, type, level, techstack, created_at
      FROM interviews
      WHERE finalized = TRUE
      ORDER BY created_at DESC
      LIMIT 6
    `;

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
