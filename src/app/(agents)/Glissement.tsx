import { ViewTransition } from "react";

// Le type de navigation est posé par les liens de NavAgents
const SENS = { "nav-avant": "nav-avant", "nav-retour": "nav-retour", default: "none" };

/** Fait glisser la page vers la gauche ou la droite lors du passage Scanner ⇄ Invités. */
export function Glissement({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={SENS} exit={SENS} default="none">
      {children}
    </ViewTransition>
  );
}
