import { jwtVerify } from "jose";

import sql from "@/lib/db";

export async function verifyNonce(nonce: string): Promise<string> {
  // TODO 1: crea la chiave secret con TextEncoder
  const secret = new TextEncoder().encode(process.env.NONCE_SECRET!);
  // TODO 2: verifica il JWT con jwtVerify → estrai payload.sub (userId) e payload.jti
  const { payload } = await jwtVerify(nonce, secret);
  const userId = payload.sub as string;
  const jti = payload.jti as string;
  // TODO 3: query su interview_nonces — cerca jti dove used = FALSE e expires_at > NOW()
  //   se non trovato → throw new Error("Nonce non valido o già usato")
  const rows = await sql`
  SELECT jti FROM interview_nonces
  WHERE jti = ${jti}
    AND used = FALSE
    AND expires_at > NOW()
`;

if (rows.length === 0) throw new Error("Nonce non valido o già usato");

  // TODO 4: marca il nonce come usato
  //   UPDATE interview_nonces SET used = TRUE WHERE jti = ...

  await sql `UPDATE interview_nonces SET used = TRUE WHERE jti = ${jti}`

  // TODO 5: ritorna userId
  return userId
}
