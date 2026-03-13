import { auth } from "@clerk/nextjs/server";

const MAX_CHARS = 12_000;
const TIMEOUT_MS = 10_000;

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const url: string = body.url ?? "";

  if (!url) return Response.json({ error: "URL mancante" }, { status: 400 });

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: "URL non valido" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return Response.json({ error: "URL non valido" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(parsed.href, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InterviewBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Il sito ha risposto con errore ${res.status}. Prova a copiare e incollare il testo dell'annuncio.` },
        { status: 422 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return Response.json(
        { error: "Il link non punta a una pagina web leggibile." },
        { status: 422 }
      );
    }

    html = await res.text();
  } catch (err) {
    const isTimeout = (err as Error).name === "TimeoutError" || (err as Error).name === "AbortError";
    return Response.json(
      { error: isTimeout ? "Il sito ha impiegato troppo tempo a rispondere." : "Impossibile raggiungere il sito. Prova a copiare e incollare il testo dell'annuncio." },
      { status: 422 }
    );
  }

  const text = extractTextFromHtml(html).slice(0, MAX_CHARS);
  if (!text) {
    return Response.json({ error: "Nessun testo leggibile trovato nella pagina." }, { status: 422 });
  }

  return Response.json({ text });
}
