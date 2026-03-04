import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";

import sql from "@/lib/db";

export async function POST() {
  // TODO 1: ottieni userId da Clerk auth → se null, ritorna 401
  const { userId } = await auth();

  if (!userId) return Response.json({ error: "Unauthorized"}, {status: 401 })
  // TODO 2: genera jti con crypto.randomUUID()
  const jti = crypto.randomUUID();
  const secret = new TextEncoder().encode(process.env.NONCE_SECRET!);
  const nonce = await new SignJWT({
    sub: userId
  })
  .setProtectedHeader({ alg: "HS256" })
  .setJti(jti)
  .setExpirationTime("2m")
  .sign(secret);

  await sql`INSERT INTO interview_nonces (jti, user_id, expires_at) VALUES (${jti}, ${userId}, NOW() + INTERVAL '2 minutes' )`; 

  
  return Response.json({ nonce })
}
