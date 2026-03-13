import sql from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ success: false, error: "Missing userId" }, { status: 401 });

  try {
    const [row] = await sql`
      SELECT
        (SELECT array_agg(DISTINCT type)   FROM interviews WHERE user_id = ${userId} AND type IS NOT NULL)   AS types,
        (SELECT array_agg(DISTINCT level)  FROM interviews WHERE user_id = ${userId} AND level IS NOT NULL)  AS levels,
        (SELECT array_agg(DISTINCT domain) FROM interviews WHERE user_id = ${userId} AND domain IS NOT NULL) AS domains,
        (SELECT array_agg(DISTINCT t)      FROM (SELECT unnest(tags) AS t FROM interviews WHERE user_id = ${userId}) sub) AS tags
    `;

    return Response.json({
      success: true,
      data: {
        types:   row.types   ?? [],
        levels:  row.levels  ?? [],
        domains: row.domains ?? [],
        tags:    row.tags    ?? [],
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Failed to fetch filters" }, { status: 500 });
  }
}
