import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pool } from "@/lib/db";
import { mariage, titreMariage } from "@/lib/config";
import { Decor, entree } from "../../Decor";
import { ActionsPartage } from "./ActionsPartage";
import { CarteRevelee } from "./CarteRevelee";

export const dynamic = "force-dynamic";

async function trouver(id: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(id)) return null;
  const { rows } = await pool.query<{ nom: string }>("SELECT nom FROM invitations WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invitation · Mariage de ${titreMariage}`,
    openGraph: { images: [`/api/invitations/${id}/carte`] },
  };
}

export default async function PageInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { id } = await params;
  const { nouveau } = await searchParams;
  const invitation = await trouver(id);
  if (!invitation) notFound();

  const prenom = invitation.nom.split(" ")[0];
  const urlCarte = `/api/invitations/${id}/carte`;

  return (
    <main className="page">
      <Decor />

      <header className="entete">
        <p className="surtitre entree" style={entree(0)}>Votre invitation</p>
        <h1 className="noms entree" style={{ ...entree(1), fontSize: "clamp(36px, 10vw, 48px)" }}>Merci {prenom} !</h1>
        <div className="filet entree" style={entree(2)} />
        <p className="date entree" style={entree(3)}>
          {titreMariage} vous attendent le {mariage.dateLongue.toLowerCase()}.
        </p>
      </header>

      <div className="entree" style={entree(4)}>
        <CarteRevelee src={urlCarte} alt={`Carte d'invitation de ${invitation.nom}`} celebrer={nouveau !== undefined} />
      </div>

      <div className="entree" style={entree(5)}>
        <ActionsPartage urlCarte={urlCarte} nom={invitation.nom} />
      </div>

      <p className="pied entree" style={entree(6)}>
        Gardez cette carte sur votre téléphone et présentez le QR code à l'entrée.
        <br />
        Il ne fonctionne qu'une seule fois : ne le partagez pas.
      </p>
    </main>
  );
}
