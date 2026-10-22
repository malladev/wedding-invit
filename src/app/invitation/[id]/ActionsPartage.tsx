"use client";

import { useState } from "react";
import { titreMariage } from "@/lib/config";

export function ActionsPartage({ urlCarte, nom }: { urlCarte: string; nom: string }) {
  const [copie, setCopie] = useState(false);

  function lienPage() {
    return window.location.href.split("?")[0];
  }

  function whatsapp() {
    const texte = `Voici mon invitation au mariage de ${titreMariage} 💍\n${lienPage()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, "_blank", "noopener");
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(lienPage());
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", lienPage());
    }
  }

  return (
    <div className="actions">
      <a className="btn btn-or" href={`${urlCarte}?telecharger`} download={`invitation-${nom}.png`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>
        Télécharger la carte (PNG)
      </a>
      <button className="btn btn-whatsapp" type="button" onClick={whatsapp}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" /></svg>
        Envoyer sur WhatsApp
      </button>
      <button className="btn btn-ligne" type="button" onClick={copier}>
        {copie ? "Lien copié ✓" : "Copier le lien de la carte"}
      </button>
    </div>
  );
}
