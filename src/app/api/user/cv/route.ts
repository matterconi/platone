import { auth } from "@clerk/nextjs/server";
import { PDFParse } from "pdf-parse";
import sql from "@/lib/db";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CHARS = 15_000;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT cv_filename FROM users WHERE id = ${userId}
  `;
  return Response.json({
    hasCv: !!row?.cv_filename,
    filename: row?.cv_filename ?? null,
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File troppo grande (max 5 MB)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  if (ext === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text;
    } catch {
      return Response.json({ error: "Impossibile leggere il PDF" }, { status: 422 });
    }
  } else if (ext === "txt") {
    text = buffer.toString("utf-8");
  } else {
    return Response.json({ error: "Formato non supportato (usa PDF o TXT)" }, { status: 415 });
  }

  text = text.trim().replace(/\s+/g, " ").slice(0, MAX_CHARS);
  if (!text) {
    return Response.json({ error: "Documento vuoto o illeggibile" }, { status: 422 });
  }

  await sql`
    UPDATE users SET cv_text = ${text}, cv_filename = ${file.name} WHERE id = ${userId}
  `;

  return Response.json({ ok: true, filename: file.name });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await sql`
    UPDATE users SET cv_text = NULL, cv_filename = NULL WHERE id = ${userId}
  `;

  return Response.json({ ok: true });
}
