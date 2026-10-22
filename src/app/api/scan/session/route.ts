import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SCAN, DUREE_SESSION_S, creerSession, egaliteSure, sessionValide } from "@/lib/crypto";

export const runtime = "nodejs";

/** Vérifie si l'agent est connecté. */
export async function GET() {
  const ok = sessionValide((await cookies()).get(COOKIE_SCAN)?.value);
  return NextResponse.json({ connecte: ok }, { status: ok ? 200 : 401 });
}

/** Connexion de l'agent d'accueil avec le code PIN. */
export async function POST(req: Request) {
  const pinAttendu = process.env.SCAN_PIN;
  const { pin } = await req.json().catch(() => ({ pin: null }));

  if (!pinAttendu || typeof pin !== "string" || !egaliteSure(pin, pinAttendu)) {
    // Ralentit les tentatives de devinette
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ erreur: "Code incorrect." }, { status: 401 });
  }

  (await cookies()).set(COOKIE_SCAN, creerSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DUREE_SESSION_S,
  });
  return NextResponse.json({ connecte: true });
}

/** Déconnexion. */
export async function DELETE() {
  (await cookies()).delete(COOKIE_SCAN);
  return NextResponse.json({ connecte: false });
}
