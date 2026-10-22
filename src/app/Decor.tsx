import type { CSSProperties } from "react";

/** Retard d'animation d'entrée : chaque élément apparaît après le précédent. */
export function entree(rang: number) {
  return { "--rang": rang } as CSSProperties;
}

// Positions fixes (pas de Math.random) pour que le rendu serveur et client soient identiques
const PAILLETTES = [
  [8, 12, 0], [22, 68, 1.2], [35, 24, 2.6], [48, 82, 0.6], [62, 8, 1.8], [74, 52, 3.1],
  [86, 18, 0.9], [92, 74, 2.2], [14, 90, 3.4], [56, 40, 1.5], [80, 92, 0.3], [4, 46, 2.9],
];

/** Halos dorés et paillettes scintillantes en arrière-plan. */
export function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <span className="halo halo-1" />
      <span className="halo halo-2" />
      <span className="halo halo-3" />
      {PAILLETTES.map(([x, y, delai], i) => (
        <span
          key={i}
          className="paillette"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delai}s` }}
        />
      ))}
    </div>
  );
}
