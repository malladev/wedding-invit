import Link from "next/link";

export default function Introuvable() {
  return (
    <main className="page">
      <header className="entete">
        <p className="surtitre">Oups</p>
        <h1 className="noms" style={{ fontSize: 40 }}>Invitation introuvable</h1>
        <div className="filet" />
        <p className="date">Ce lien n'est pas valide. Vérifiez le lien reçu ou générez une nouvelle invitation.</p>
      </header>
      <Link className="btn btn-or" href="/">Retour à l'accueil</Link>
    </main>
  );
}
