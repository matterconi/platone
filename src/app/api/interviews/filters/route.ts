import sql from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ success: false, error: "Missing userId" }, { status: 401 });

  try {
    const [row] = await sql`
      SELECT
        (SELECT array_agg(DISTINCT type)          FROM interviews WHERE user_id = ${userId}) AS types,
        (SELECT array_agg(DISTINCT specialization) FROM interviews WHERE user_id = ${userId} AND specialization IS NOT NULL) AS specializations,
        (SELECT array_agg(DISTINCT t)              FROM (SELECT unnest(techstack) AS t FROM interviews WHERE user_id = ${userId}) sub) AS techs
    `;

    return Response.json({
      success: true,
      data: {
        types: row.types ?? [],
        specializations: row.specializations ?? [],
        techs: row.techs ?? [],
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Failed to fetch filters" }, { status: 500 });
  }
}
