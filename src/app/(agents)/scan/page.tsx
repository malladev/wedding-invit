import { cookies } from "next/headers";
import { COOKIE_SCAN, sessionValide } from "@/lib/crypto";
import { Glissement } from "../Glissement";
import { Scanner } from "./Scanner";

export const dynamic = "force-dynamic";

export default async function PageScan() {
  // Session connue dès le rendu serveur : pas d'écran vide pendant la vérification
  const connecte = sessionValide((await cookies()).get(COOKIE_SCAN)?.value);

  return (
    <Glissement>
      <Scanner connecteInitial={connecte} />
    </Glissement>
  );
}
