"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type QrScanner from "qr-scanner";
import { titreMariage } from "@/lib/config";

type Resultat =
  | { statut: "valide"; nom: string; telephone: string }
  | { statut: "deja_utilise"; nom: string; telephone: string; utiliseLe: string }
  | { statut: "invalide"; message: string };

export default function PageScan() {
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [entrees, setEntrees] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<QrScanner | null>(null);
  const enCours = useRef(false);

  useEffect(() => {
    fetch("/api/scan/session").then((r) => setConnecte(r.ok)).catch(() => setConnecte(false));
  }, []);

  const verifier = useCallback(async (jeton: string) => {
    if (enCours.current) return;
    enCours.current = true;
    scanner.current?.pause();
    if (navigator.vibrate) navigator.vibrate(120);
    try {
      const rep = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton }),
      });
      if (rep.status === 401) {
        setConnecte(false);
        return;
      }
      const json: Resultat = await rep.json();
      setResultat(json);
      if (json.statut === "valide") setEntrees((n) => n + 1);
    } catch {
      setResultat({ statut: "invalide", message: "Problème de connexion. Réessayez." });
    }
  }, []);

  // Démarre la caméra une fois connecté
  useEffect(() => {
    if (!connecte || !video.current) return;
    let actif = true;
    import("qr-scanner").then(({ default: QrScanner }) => {
      if (!actif || !video.current) return;
      scanner.current = new QrScanner(video.current, (r) => verifier(r.data), {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
        maxScansPerSecond: 5,
      });
      scanner.current.start().catch(() =>
        setErreur("Impossible d'accéder à la caméra. Autorisez la caméra (le site doit être en HTTPS)."),
      );
    });
    return () => {
      actif = false;
      scanner.current?.destroy();
      scanner.current = null;
    };
  }, [connecte, verifier]);

  function suivant() {
    setResultat(null);
    enCours.current = false;
    scanner.current?.start();
  }

  async function connexion(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    const rep = await fetch("/api/scan/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (rep.ok) {
      setPin("");
      setConnecte(true);
    } else setErreur("Code incorrect.");
  }

  async function deconnexion() {
    await fetch("/api/scan/session", { method: "DELETE" });
    setConnecte(false);
  }

  if (connecte === null) return <main className="scan" />;

  if (!connecte) {
    return (
      <main className="page">
        <header className="entete">
          <p className="surtitre">Accueil des invités</p>
          <h1 className="noms" style={{ fontSize: 40 }}>{titreMariage}</h1>
          <div className="filet" />
        </header>
        <form className="bloc" onSubmit={connexion}>
          <h2>Connexion agent</h2>
          <label>
            Code d'accès
            <input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} required />
          </label>
          {erreur && <p className="erreur">{erreur}</p>}
          <button className="btn btn-or" type="submit">Ouvrir le scanner</button>
        </form>
      </main>
    );
  }

  return (
    <main className="scan">
      <div className="scan-barre">
        <strong>Scanner les invitations</strong>
        <button type="button" onClick={deconnexion}>Se déconnecter</button>
      </div>
      <div className="camera">
        <video ref={video} muted playsInline />
      </div>
      {erreur && <p className="erreur">{erreur}</p>}
      <p className="compteur">Placez le QR code de la carte dans le cadre · {entrees} entrée(s) validée(s) sur cet appareil</p>

      {resultat && (
        <div className={`resultat ${resultat.statut}`} role="alert">
          {resultat.statut === "valide" && (
            <>
              <div className="icone">✓</div>
              <h1>Accès autorisé</h1>
              <div className="nom">{resultat.nom}</div>
              <p>{resultat.telephone}</p>
            </>
          )}
          {resultat.statut === "deja_utilise" && (
            <>
              <div className="icone">✕</div>
              <h1>Carte déjà utilisée</h1>
              <div className="nom">{resultat.nom}</div>
              <p>{resultat.telephone}</p>
              <p>Entrée enregistrée le {resultat.utiliseLe}</p>
            </>
          )}
          {resultat.statut === "invalide" && (
            <>
              <div className="icone">!</div>
              <h1>QR code invalide</h1>
              <p>{resultat.message}</p>
            </>
          )}
          <button className="btn" type="button" onClick={suivant}>Scanner suivant</button>
        </div>
      )}
    </main>
  );
}
