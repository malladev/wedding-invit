import "server-only";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { mariage } from "./config";

export const LARGEUR = 1080;
export const HAUTEUR = 1350;

const OR = "#B8892B";
const OR_CLAIR = "#E2C27A";
const ENCRE = "#2A2620";
const DOSSIER = path.join(process.cwd(), "assets");

/* ---------- Ressources (chargées une seule fois) ---------- */

let polices: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 600 | 700; style: "normal" }[]> | null = null;

function chargerPolices() {
  if (!polices) {
    const f = (fichier: string) => readFile(path.join(DOSSIER, "fonts", fichier));
    polices = Promise.all([
      f("cormorant-garamond-latin-500-normal.woff").then((data) => ({ name: "Cormorant", data, weight: 500 as const, style: "normal" as const })),
      f("cormorant-garamond-latin-600-normal.woff").then((data) => ({ name: "Cormorant", data, weight: 600 as const, style: "normal" as const })),
      f("cormorant-garamond-latin-700-normal.woff").then((data) => ({ name: "Cormorant", data, weight: 700 as const, style: "normal" as const })),
      f("montserrat-latin-400-normal.woff").then((data) => ({ name: "Montserrat", data, weight: 400 as const, style: "normal" as const })),
      f("montserrat-latin-500-normal.woff").then((data) => ({ name: "Montserrat", data, weight: 500 as const, style: "normal" as const })),
      f("montserrat-latin-600-normal.woff").then((data) => ({ name: "Montserrat", data, weight: 600 as const, style: "normal" as const })),
      f("montserrat-latin-700-normal.woff").then((data) => ({ name: "Montserrat", data, weight: 700 as const, style: "normal" as const })),
    ]);
  }
  return polices;
}

/** Photo du couple facultative : assets/couple.png (idéalement détourée, fond transparent). */
async function chargerPhoto(): Promise<string | null> {
  for (const [fichier, type] of [["couple.png", "image/png"], ["couple.jpg", "image/jpeg"]] as const) {
    const chemin = path.join(DOSSIER, fichier);
    try {
      await access(chemin);
      return `data:${type};base64,${(await readFile(chemin)).toString("base64")}`;
    } catch {}
  }
  return null;
}

/* ---------- Décors SVG ---------- */

const svg = (contenu: string) => `data:image/svg+xml;utf8,${encodeURIComponent(contenu)}`;

const DEGRADE_OR = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8E7AE"/><stop offset=".45" stop-color="#D8AC4C"/><stop offset="1" stop-color="#9A6E1E"/></linearGradient>`;

function feuille(x: number, y: number, angle: number, echelle = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${echelle})">
    <path d="M0 0 C22 -26 70 -26 96 0 C70 26 22 26 0 0Z" fill="url(#g)"/>
    <path d="M2 0 L94 0" stroke="#8A6218" stroke-width="1.4" opacity=".55"/>
    <path d="M26 0 L40 -13 M26 0 L40 13 M50 0 L63 -12 M50 0 L63 12 M72 0 L82 -8 M72 0 L82 8" stroke="#8A6218" stroke-width="1" opacity=".4"/>
  </g>`;
}

/** Branche de feuilles dorées */
const BRANCHE = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs>${DEGRADE_OR}</defs>
  <path d="M20 290 C80 220 140 160 260 40" stroke="#B8892B" stroke-width="3" fill="none"/>
  ${feuille(70, 228, -110, 0.9)}${feuille(70, 228, 10, 0.9)}
  ${feuille(130, 165, -105, 1)}${feuille(130, 165, 5, 1)}
  ${feuille(195, 100, -100, 0.95)}${feuille(195, 100, 0, 0.95)}
  ${feuille(255, 44, -45, 0.85)}
</svg>`);

const FEUILLE_SEULE = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -30 104 60"><defs>${DEGRADE_OR}</defs>${feuille(0, 0, 0)}</svg>`);

const ICONES = {
  date: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>`),
  heure: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`),
  lieu: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`),
};

/* ---------- Carte ---------- */

export async function genererCarte(invite: { nom: string; jeton: string }) {
  const [fonts, photo, qr] = await Promise.all([
    chargerPolices(),
    chargerPhoto(),
    QRCode.toDataURL(invite.jeton, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 520,
      color: { dark: "#1E1A14", light: "#FFFFFF" },
    }),
  ]);

  const initiales = `${mariage.mariee[0]}${mariage.marie[0]}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: LARGEUR,
          height: HAUTEUR,
          display: "flex",
          position: "relative",
          fontFamily: "Montserrat",
          color: ENCRE,
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAF6EE 45%, #F3ECDD 100%)",
          overflow: "hidden",
        }}
      >
        {/* Reflets satinés */}
        <div style={{ position: "absolute", top: -200, left: 260, width: 900, height: 700, borderRadius: 450, background: "linear-gradient(200deg, rgba(255,255,255,0.9), rgba(255,255,255,0))", display: "flex" }} />

        {/* Grand chiffre doré (jour du mariage) */}
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 400,
            width: 640,
            display: "flex",
            justifyContent: "center",
            fontFamily: "Cormorant",
            fontWeight: 700,
            fontSize: 640,
            lineHeight: 1,
            letterSpacing: -30,
            color: "#C99A3E",
            opacity: photo ? 0.85 : 0.95,
          }}
        >
          {mariage.jour}
        </div>
        <div
          style={{
            position: "absolute",
            top: 805,
            left: 400,
            width: 640,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            color: OR,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: 12,
          }}
        >
          <div style={{ width: 60, height: 2, background: OR, display: "flex" }} />
          {`${mariage.mois.toUpperCase()} ${mariage.annee}`}
          <div style={{ width: 60, height: 2, background: OR, display: "flex" }} />
        </div>

        {/* Photo du couple (facultative) */}
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={620}
            height={720}
            style={{ position: "absolute", top: 260, left: 400, objectFit: "contain", objectPosition: "bottom" }}
          />
        )}

        {/* Feuilles dorées */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRANCHE} alt="" width={260} height={260} style={{ position: "absolute", top: -110, right: -60, transform: "rotate(100deg)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FEUILLE_SEULE} alt="" width={160} height={92} style={{ position: "absolute", top: 600, right: -50, transform: "rotate(160deg)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FEUILLE_SEULE} alt="" width={130} height={75} style={{ position: "absolute", top: 1075, right: 0, transform: "rotate(-150deg)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRANCHE} alt="" width={230} height={230} style={{ position: "absolute", top: 1000, left: -95, transform: "rotate(-15deg)" }} />

        {/* Vagues dorées en bas */}
        <div style={{ position: "absolute", left: -240, top: 1120, width: 1560, height: 520, borderRadius: "50%", background: "linear-gradient(90deg, #A97A22, #F3D98E 35%, #C89A3F 65%, #F0D489)", display: "flex" }} />
        <div style={{ position: "absolute", left: -200, top: 1142, width: 1480, height: 520, borderRadius: "50%", background: "linear-gradient(180deg, #F7F1E5, #F3ECDD)", display: "flex" }} />
        <div style={{ position: "absolute", left: -420, top: 1200, width: 1000, height: 420, borderRadius: "50%", background: "linear-gradient(120deg, #F2DC9E, #C3923A 55%, #E8C877)", display: "flex" }} />
        <div style={{ position: "absolute", left: 500, top: 1215, width: 1000, height: 420, borderRadius: "50%", background: "linear-gradient(240deg, #F2DC9E, #C3923A 55%, #E8C877)", display: "flex" }} />

        {/* En-tête gauche */}
        <div style={{ position: "absolute", top: 90, left: 80, display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: 700, fontSize: 50, lineHeight: 1.08, display: "flex" }}>VOUS ÊTES</div>
          <div style={{ fontWeight: 700, fontSize: 50, lineHeight: 1.08, display: "flex" }}>INVITÉ(E)</div>
          <div style={{ fontWeight: 700, fontSize: 50, lineHeight: 1.08, color: OR, display: "flex" }}>À NOTRE MARIAGE</div>
          <div style={{ width: 54, height: 3, background: OR, marginTop: 26, marginBottom: 24, display: "flex" }} />
          <div style={{ fontSize: 23, lineHeight: 1.45, width: 330, color: "#3A352D", display: "flex" }}>{mariage.message}</div>
        </div>

        {/* Monogramme en haut à droite */}
        <div style={{ position: "absolute", top: 80, right: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              border: `3px solid ${OR}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Cormorant",
              fontWeight: 600,
              fontSize: 46,
              color: ENCRE,
            }}
          >
            {initiales[0]}
            <span style={{ color: OR, fontSize: 34, margin: "0 4px" }}>&</span>
            {initiales[1]}
          </div>
          <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, letterSpacing: 5, color: OR, display: "flex" }}>SAVE THE DATE</div>
        </div>

        {/* Bloc invité + QR code */}
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 80,
            width: 330,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 24px 20px",
            borderRadius: 30,
            border: `2px solid ${OR_CLAIR}`,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 12px 40px rgba(150,110,40,0.18)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 4, color: OR, display: "flex" }}>INVITÉ(E) D'HONNEUR</div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "Cormorant",
              fontWeight: 700,
              fontSize: invite.nom.length > 22 ? 30 : 36,
              lineHeight: 1.1,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {invite.nom}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" width={240} height={240} style={{ marginTop: 16, borderRadius: 8 }} />
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5C5446" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: OR, display: "flex" }} />
            Code personnel · valable une seule fois
          </div>
        </div>

        {/* Prénoms des mariés */}
        <div style={{ position: "absolute", top: 905, left: 0, width: LARGEUR, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 104, lineHeight: 1, display: "flex", alignItems: "baseline" }}>
            {mariage.mariee.toUpperCase()}
            <span style={{ color: OR, margin: "0 26px", fontWeight: 500 }}>&</span>
            {mariage.marie.toUpperCase()}
          </div>
          <div style={{ marginTop: 14, color: OR, fontWeight: 600, fontSize: 36, letterSpacing: 16, display: "flex" }}>{mariage.familles}</div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 18, fontSize: 21, fontWeight: 500, letterSpacing: 9 }}>
            <div style={{ width: 40, height: 2, background: ENCRE, display: "flex" }} />
            {mariage.devise.toUpperCase()}
            <div style={{ width: 40, height: 2, background: ENCRE, display: "flex" }} />
          </div>
        </div>

        {/* Bandeau infos pratiques */}
        <div
          style={{
            position: "absolute",
            top: 1222,
            left: 90,
            width: 900,
            height: 76,
            borderRadius: 38,
            border: `2px solid ${OR_CLAIR}`,
            background: "rgba(255,255,255,0.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            fontSize: 20,
            fontWeight: 500,
          }}
        >
          {(
            [
              [ICONES.date, mariage.dateLongue],
              [ICONES.heure, mariage.heure],
              [ICONES.lieu, mariage.lieu],
            ] as const
          ).map(([icone, texte], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {i > 0 && <div style={{ width: 2, height: 30, background: OR_CLAIR, marginRight: 14, display: "flex" }} />}
              <div style={{ width: 36, height: 36, borderRadius: 18, background: OR, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icone} alt="" width={20} height={20} />
              </div>
              {texte}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: LARGEUR, height: HAUTEUR, fonts },
  );
}
