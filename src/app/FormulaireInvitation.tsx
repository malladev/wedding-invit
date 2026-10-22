"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormulaireInvitation() {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const donnees = new FormData(e.currentTarget);

    try {
      const rep = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: donnees.get("nom"),
          telephone: donnees.get("telephone"),
        }),
      });
      const json = await rep.json();
      if (!rep.ok) throw new Error(json.erreur || "Une erreur est survenue.");
      // ?nouveau : la page de la carte lance les confettis
      router.push(`/invitation/${json.id}?nouveau=1`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnvoi(false);
    }
  }

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <label>
        Nom complet
        <span className="champ">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
          <input name="nom" required minLength={3} maxLength={60} autoComplete="name" placeholder="Ex. Fatoumata Diarra" />
        </span>
      </label>
      <label>
        Numéro de téléphone
        <span className="champ">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></svg>
          <input
            name="telephone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ex. +223 70 00 00 00"
            pattern="[+0-9 .\(\)\-]{8,20}"
          />
        </span>
      </label>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="btn btn-or btn-brillant" type="submit" disabled={envoi}>
        {envoi ? (
          <>
            <span className="chargement" aria-hidden="true" />
            Création de votre carte…
          </>
        ) : (
          <>
            Générer mon invitation
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </>
        )}
      </button>
    </form>
  );
}
