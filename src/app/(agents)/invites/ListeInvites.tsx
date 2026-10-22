"use client";

import { ViewTransition, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type Invite = {
  id: string;
  nom: string;
  telephone: string; // déjà masqué
  arrivee: number | null; // horodatage du scan, null si pas encore arrivé
  heure: string | null;
};

type Filtre = "tous" | "presents" | "absents";

const ACTUALISATION_MS = 20_000;
const RAYON = 34;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

function sansAccents(texte: string) {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function initiales(nom: string) {
  return nom.split(/\s+/).slice(0, 2).map((mot) => mot[0]).join("").toUpperCase();
}

export function ListeInvites({ invites, miseAJour }: { invites: Invite[]; miseAJour: string }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [actualisation, lancerActualisation] = useTransition();
  const [, lancerFiltre] = useTransition();

  // Les présences changent pendant que les agents scannent : on recharge régulièrement
  useEffect(() => {
    const actualiser = () => {
      if (document.visibilityState === "visible") lancerActualisation(() => router.refresh());
    };
    const minuteur = setInterval(actualiser, ACTUALISATION_MS);
    document.addEventListener("visibilitychange", actualiser);
    return () => {
      clearInterval(minuteur);
      document.removeEventListener("visibilitychange", actualiser);
    };
  }, [router]);

  const presents = invites.filter((i) => i.arrivee !== null).length;
  const total = invites.length;
  const taux = total ? Math.round((presents / total) * 100) : 0;

  const visibles = useMemo(() => {
    const terme = sansAccents(recherche.trim());
    const chiffres = recherche.replace(/\D/g, "");
    const liste = invites.filter((i) => {
      if (filtre === "presents" && i.arrivee === null) return false;
      if (filtre === "absents" && i.arrivee !== null) return false;
      if (!terme) return true;
      return sansAccents(i.nom).includes(terme) || (chiffres.length > 0 && i.telephone.replace(/\D/g, "").includes(chiffres));
    });
    // Présents : les dernières arrivées en premier
    return filtre === "presents" ? liste.sort((a, b) => b.arrivee! - a.arrivee!) : liste;
  }, [invites, recherche, filtre]);

  function choisirFiltre(f: Filtre) {
    // Dans une transition : la liste fait un fondu enchaîné (ViewTransition plus bas)
    lancerFiltre(() => setFiltre(f));
  }

  const onglets: { valeur: Filtre; libelle: string; nombre: number }[] = [
    { valeur: "tous", libelle: "Tous", nombre: total },
    { valeur: "presents", libelle: "Présents", nombre: presents },
    { valeur: "absents", libelle: "Absents", nombre: total - presents },
  ];

  return (
    <>
      <header className="invites-entete entree">
        <div>
          <p className="surtitre">Accueil des invités</p>
          <h1>Liste des invités</h1>
        </div>
        <button
          className={`invites-actualiser${actualisation ? " en-cours" : ""}`}
          type="button"
          onClick={() => lancerActualisation(() => router.refresh())}
          aria-label="Actualiser la liste"
          title={`Mis à jour à ${miseAJour}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></svg>
        </button>
      </header>

      <section className="invites-stats bloc entree" style={{ "--rang": 1 } as React.CSSProperties}>
        <div className="anneau-presence" role="img" aria-label={`${taux} % des invités sont arrivés`}>
          <svg viewBox="0 0 80 80" aria-hidden="true">
            <circle className="anneau-fond" cx="40" cy="40" r={RAYON} />
            <circle
              className="anneau-valeur"
              cx="40"
              cy="40"
              r={RAYON}
              strokeDasharray={CIRCONFERENCE}
              strokeDashoffset={CIRCONFERENCE * (1 - taux / 100)}
            />
          </svg>
          <strong>{taux}%</strong>
        </div>
        <dl className="invites-chiffres">
          <div><dt>Présents</dt><dd className="vert">{presents}</dd></div>
          <div><dt>Attendus</dt><dd>{total - presents}</dd></div>
          <div><dt>Total</dt><dd>{total}</dd></div>
        </dl>
        <p className="invites-maj">
          <span className="point-direct" aria-hidden="true" /> Actualisé automatiquement · {miseAJour}
        </p>
      </section>

      <div className="invites-outils entree" style={{ "--rang": 2 } as React.CSSProperties}>
        <label className="champ invites-recherche">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            type="search"
            placeholder="Nom ou fin du numéro…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher un invité"
          />
        </label>

        <div className="filtres" role="tablist" data-filtre={filtre}>
          <span className="filtres-pastille" aria-hidden="true" />
          {onglets.map((o) => (
            <button
              key={o.valeur}
              type="button"
              role="tab"
              aria-selected={filtre === o.valeur}
              onClick={() => choisirFiltre(o.valeur)}
            >
              {o.libelle} <span>{o.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      <ViewTransition key={filtre} name="liste-invites" share="auto" enter="auto" default="none">
        {visibles.length === 0 ? (
          <p className="invites-vide">
            {total === 0
              ? "Aucune invitation n'a encore été créée."
              : recherche
                ? `Aucun invité ne correspond à « ${recherche} ».`
                : filtre === "presents"
                  ? "Personne n'est encore arrivé."
                  : "Tout le monde est arrivé 🎉"}
          </p>
        ) : (
          <ul className="invites-liste">
            {visibles.map((i, rang) => (
              <li
                key={i.id}
                className={`invite ${i.arrivee !== null ? "present" : "absent"}`}
                style={{ "--rang": Math.min(rang, 12) } as React.CSSProperties}
              >
                <span className="invite-avatar" aria-hidden="true">{initiales(i.nom)}</span>
                <span className="invite-identite">
                  <strong>{i.nom}</strong>
                  <small>{i.telephone}</small>
                </span>
                {i.arrivee !== null ? (
                  <span className="statut statut-present">Arrivé·e à {i.heure}</span>
                ) : (
                  <span className="statut statut-absent">Attendu·e</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </ViewTransition>
    </>
  );
}
