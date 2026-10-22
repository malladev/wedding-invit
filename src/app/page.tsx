import { mariage } from "@/lib/config";
import { FormulaireInvitation } from "./FormulaireInvitation";
import { Decor, entree } from "./Decor";

export default async function Accueil({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;

  return (
    <main className="page">
      <Decor />

      <header className="entete">
        <svg className="anneaux entree" style={entree(0)} viewBox="0 0 96 56" aria-hidden="true">
          <circle cx="36" cy="30" r="20" />
          <circle cx="60" cy="30" r="20" />
          <path className="anneaux-diamant" d="M56 6l4-4 4 4-4 5z" />
        </svg>
        <p className="surtitre entree" style={entree(1)}>Nous nous marions</p>
        <h1 className="noms entree" style={entree(2)}>
          {mariage.mariee} <span className="esperluette">&</span> {mariage.marie}
        </h1>
        <div className="filet entree" style={entree(3)} />
        <ul className="infos entree" style={entree(4)}>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4m8-4v4" /></svg>
            {mariage.dateLongue}
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            {mariage.heure}
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            {mariage.lieu}
          </li>
        </ul>
      </header>

      <section className="bloc entree" style={entree(5)}>
        <h2>Recevez votre invitation</h2>
        <p className="aide">
          Renseignez votre nom et votre numéro. Votre carte personnelle avec son QR code d'accès sera
          générée tout de suite.
        </p>
        <FormulaireInvitation cle={k ?? ""} />
      </section>

      <p className="pied entree" style={entree(6)}>
        Le QR code est personnel et ne peut être utilisé qu'une seule fois à l'entrée.
      </p>
    </main>
  );
}
