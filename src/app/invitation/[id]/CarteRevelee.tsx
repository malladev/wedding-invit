"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

const COULEURS = ["#b8892b", "#e2c27a", "#f6ecd2", "#c99a3e", "#ffffff"];

function lancerConfettis() {
  const commun = { colors: COULEURS, disableForReducedMotion: true, zIndex: 50 };
  confetti({ ...commun, particleCount: 120, spread: 80, startVelocity: 45, origin: { y: 0.6 } });

  // Puis deux salves depuis les côtés pendant ~1,5 s
  const fin = Date.now() + 1500;
  (function salve() {
    confetti({ ...commun, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confetti({ ...commun, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
    if (Date.now() < fin) requestAnimationFrame(salve);
  })();
}

/** Aperçu de la carte : chargement animé, révélation, puis confettis si elle vient d'être générée. */
export function CarteRevelee({ src, alt, celebrer }: { src: string; alt: string; celebrer: boolean }) {
  const img = useRef<HTMLImageElement>(null);
  const dejaFete = useRef(false);
  const [etat, setEtat] = useState<"chargement" | "prete" | "erreur">("chargement");

  // L'image a pu finir de charger avant l'hydratation (onLoad ne se déclenche alors pas)
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setEtat("prete");
  }, []);

  useEffect(() => {
    if (etat !== "prete" || !celebrer || dejaFete.current) return;
    dejaFete.current = true;
    lancerConfettis();
    // Retire ?nouveau de l'URL : pas de confettis au rechargement ni dans le lien partagé
    window.history.replaceState(null, "", window.location.pathname);
  }, [etat, celebrer]);

  return (
    <div className={`carte-cadre est-${etat}`}>
      {etat === "chargement" && (
        <div className="carte-attente" aria-live="polite">
          <span className="chargement" aria-hidden="true" />
          Préparation de votre carte…
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        className="apercu-carte"
        src={src}
        alt={alt}
        width={1080}
        height={1350}
        onLoad={() => setEtat("prete")}
        onError={() => setEtat("erreur")}
      />
    </div>
  );
}
