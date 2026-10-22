"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Bouton flottant d'accès au scanner.
 * Le code PIN n'est demandé qu'une fois : la session (cookie signé) reste valide 24 h.
 */
export function BoutonScan() {
  const router = useRouter();
  const pathname = usePathname();
  const dialogue = useRef<HTMLDialogElement>(null);
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  // Espace agents : la barre d'onglets Scanner / Invités prend le relais
  if (pathname === "/scan" || pathname.startsWith("/invites")) return null;

  async function ouvrir() {
    if (occupe) return;
    setOccupe(true);
    // Code déjà saisi depuis moins de 24 h : accès direct à la caméra
    const rep = await fetch("/api/scan/session").catch(() => null);
    setOccupe(false);
    if (rep?.ok) return router.push("/scan");
    setErreur(null);
    dialogue.current?.showModal();
  }

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);
    const rep = await fetch("/api/scan/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    }).catch(() => null);
    setOccupe(false);
    if (rep?.ok) {
      dialogue.current?.close();
      router.push("/scan");
    } else {
      setErreur(rep ? "Code incorrect." : "Problème de connexion. Réessayez.");
    }
  }

  return (
    <>
      <button
        className="bouton-scan"
        type="button"
        onClick={ouvrir}
        aria-label="Scanner les invitations"
        title="Scanner les invitations"
      >
        {occupe ? (
          <span className="chargement" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2m0 8v2a2 2 0 0 1-2 2h-2m-8 0H6a2 2 0 0 1-2-2v-2M7 12h10" />
          </svg>
        )}
      </button>

      <dialog
        ref={dialogue}
        className="pin-dialogue"
        onClose={() => setPin("")}
        // Clic sur le fond assombri : ferme la fenêtre
        onClick={(e) => e.target === e.currentTarget && dialogue.current?.close()}
      >
        <form className="pin-contenu" onSubmit={valider}>
          <div className="pin-icone" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4.5v2" /></svg>
          </div>
          <h2>Accès agents d'accueil</h2>
          <p className="aide">Entrez le code pour ouvrir le scanner. Il restera mémorisé 24 h sur cet appareil.</p>
          <input
            className="pin-champ"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Code d'accès"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            autoFocus
          />
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
          <button className="btn btn-or btn-brillant" type="submit" disabled={occupe}>
            {occupe ? (
              <>
                <span className="chargement" aria-hidden="true" />
                Vérification…
              </>
            ) : (
              "Ouvrir le scanner"
            )}
          </button>
          <button className="btn btn-ligne" type="button" onClick={() => dialogue.current?.close()}>
            Annuler
          </button>
        </form>
      </dialog>
    </>
  );
}
