import { genererCarte } from "@/lib/carte";

export const runtime = "nodejs";

/**
 * Aperçu de la carte avec un invité fictif, pour ajuster le design.
 * Désactivé en production sauf si ALLOW_PREVIEW=1.
 * Exemple : /api/apercu?nom=Fatoumata Diarra
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PREVIEW !== "1") {
    return new Response("Introuvable", { status: 404 });
  }
  const nom = new URL(req.url).searchParams.get("nom") || "Fatoumata Diarra";
  return genererCarte({ nom, jeton: "INV1.APERCU-" + "x".repeat(150) });
}
