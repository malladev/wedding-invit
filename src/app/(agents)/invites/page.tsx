import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { COOKIE_SCAN, sessionValide } from "@/lib/crypto";
import { masquerTelephone } from "@/lib/validation";
import { mariage, titreMariage } from "@/lib/config";
import { Glissement } from "../Glissement";
import { ListeInvites, type Invite } from "./ListeInvites";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Invités · Mariage de ${titreMariage}` };

// Formaté côté serveur : même rendu serveur et client, quel que soit le fuseau du téléphone
const formatHeure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: mariage.fuseau });

export default async function PageInvites() {
  // Même protection que le scanner : le code PIN doit avoir été saisi
  if (!sessionValide((await cookies()).get(COOKIE_SCAN)?.value)) redirect("/scan");

  const { rows } = await pool.query<{ id: string; nom: string; telephone: string; utilise_le: Date | null }>(
    "SELECT id, nom, telephone, utilise_le FROM invitations ORDER BY nom",
  );

  const invites: Invite[] = rows.map((r) => ({
    id: r.id,
    nom: r.nom,
    // Numéro masqué : la liste reste lisible par-dessus l'épaule sans exposer les numéros
    telephone: masquerTelephone(r.telephone),
    arrivee: r.utilise_le ? r.utilise_le.getTime() : null,
    heure: r.utilise_le ? formatHeure.format(r.utilise_le) : null,
  }));

  return (
    <Glissement>
      <main className="page page-agents">
        <ListeInvites invites={invites} miseAJour={formatHeure.format(new Date())} />
      </main>
    </Glissement>
  );
}
