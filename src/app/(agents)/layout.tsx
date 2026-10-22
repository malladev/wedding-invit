import { cookies } from "next/headers";
import { COOKIE_SCAN, sessionValide } from "@/lib/crypto";
import { NavAgents } from "./NavAgents";

/** Espace des agents d'accueil (/scan, /invites) : barre de navigation une fois le code PIN saisi. */
export default async function LayoutAgents({ children }: { children: React.ReactNode }) {
  const connecte = sessionValide((await cookies()).get(COOKIE_SCAN)?.value);

  return (
    <>
      {children}
      {connecte && <NavAgents />}
    </>
  );
}
