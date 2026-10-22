import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { chiffrerJeton, genererId } from "@/lib/crypto";
import { normaliserNom, normaliserTelephone } from "@/lib/validation";

export const runtime = "nodejs";

function erreur(message: string, status: number) {
  return NextResponse.json({ erreur: message }, { status });
}

export async function POST(req: Request) {
  let corps: { nom?: unknown; telephone?: unknown };
  try {
    corps = await req.json();
  } catch {
    return erreur("Requête invalide.", 400);
  }

  const nom = normaliserNom(corps.nom);
  if (!nom) return erreur("Veuillez saisir un nom complet valide (lettres uniquement).", 400);

  const telephone = normaliserTelephone(corps.telephone);
  if (!telephone) return erreur("Veuillez saisir un numéro de téléphone valide.", 400);

  // Une invitation existe déjà pour ce numéro ?
  const existante = await pool.query<{ id: string; nom: string }>(
    "SELECT id, nom FROM invitations WHERE telephone = $1",
    [telephone],
  );
  if (existante.rowCount) {
    const inv = existante.rows[0];
    // Même personne qui a perdu sa carte : on lui redonne la même carte (même QR code)
    if (inv.nom.toLocaleLowerCase("fr") === nom.toLocaleLowerCase("fr")) {
      return NextResponse.json({ id: inv.id, existante: true });
    }
    return erreur("Ce numéro est déjà associé à une invitation.", 409);
  }

  // Nombre maximum d'invitations (optionnel)
  const max = Number(process.env.MAX_INVITATIONS || 0);
  if (max > 0) {
    const { rows } = await pool.query<{ total: string }>("SELECT count(*) AS total FROM invitations");
    if (Number(rows[0].total) >= max) {
      return erreur("Le nombre maximum d'invitations est atteint. Contactez les mariés.", 403);
    }
  }

  const id = genererId();
  const jeton = chiffrerJeton({ i: id, n: nom, p: telephone });

  const insertion = await pool.query(
    `INSERT INTO invitations (id, nom, telephone, jeton)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telephone) DO NOTHING`,
    [id, nom, telephone, jeton],
  );
  if (!insertion.rowCount) {
    // Inscription simultanée avec le même numéro
    return erreur("Ce numéro est déjà associé à une invitation.", 409);
  }

  return NextResponse.json({ id }, { status: 201 });
}
