import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { COOKIE_SCAN, dechiffrerJeton, sessionValide } from "@/lib/crypto";
import { masquerTelephone } from "@/lib/validation";
import { mariage } from "@/lib/config";

export const runtime = "nodejs";

function heure(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    timeZone: mariage.fuseau,
  }).format(date);
}

export async function POST(req: Request) {
  const session = (await cookies()).get(COOKIE_SCAN)?.value;
  if (!sessionValide(session)) {
    return NextResponse.json({ erreur: "Session expirée. Reconnectez-vous." }, { status: 401 });
  }

  const { jeton } = await req.json().catch(() => ({ jeton: null }));
  const contenu = typeof jeton === "string" ? dechiffrerJeton(jeton) : null;
  if (!contenu) {
    return NextResponse.json({ statut: "invalide", message: "QR code non reconnu ou falsifié." });
  }

  // Mise à jour atomique : une seule requête peut passer de "non utilisé" à "utilisé",
  // même si deux agents scannent la même carte au même instant.
  const valide = await pool.query<{ nom: string; telephone: string }>(
    `UPDATE invitations
        SET utilise_le = now()
      WHERE id = $1 AND jeton = $2 AND utilise_le IS NULL
      RETURNING nom, telephone`,
    [contenu.i, jeton],
  );

  if (valide.rowCount) {
    const { nom, telephone } = valide.rows[0];
    return NextResponse.json({ statut: "valide", nom, telephone: masquerTelephone(telephone) });
  }

  const existante = await pool.query<{ nom: string; telephone: string; utilise_le: Date | null }>(
    "SELECT nom, telephone, utilise_le FROM invitations WHERE id = $1 AND jeton = $2",
    [contenu.i, jeton],
  );
  const inv = existante.rows[0];
  if (inv?.utilise_le) {
    return NextResponse.json({
      statut: "deja_utilise",
      nom: inv.nom,
      telephone: masquerTelephone(inv.telephone),
      utiliseLe: heure(inv.utilise_le),
    });
  }

  return NextResponse.json({ statut: "invalide", message: "Invitation introuvable ou annulée." });
}
