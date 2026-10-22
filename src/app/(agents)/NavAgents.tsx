"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Onglets Scanner ⇄ Invités. Scanner est « à gauche », Invités « à droite » :
 * chaque lien indique le sens du glissement de page (voir Glissement.tsx).
 */
export function NavAgents() {
  const pathname = usePathname();
  const surInvites = pathname.startsWith("/invites");

  return (
    <nav className="nav-agents" aria-label="Espace agents" data-onglet={surInvites ? "invites" : "scan"}>
      <span className="nav-agents-pastille" aria-hidden="true" />
      <Link href="/scan" transitionTypes={["nav-retour"]} aria-current={surInvites ? undefined : "page"}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2m0 8v2a2 2 0 0 1-2 2h-2m-8 0H6a2 2 0 0 1-2-2v-2M7 12h10" />
        </svg>
        Scanner
      </Link>
      <Link href="/invites" transitionTypes={["nav-avant"]} aria-current={surInvites ? "page" : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7m2.5 8.5a6.5 6.5 0 0 0-3-5.5" />
        </svg>
        Invités
      </Link>
    </nav>
  );
}
