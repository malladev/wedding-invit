import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const PREFIXE = "INV1.";

export type ContenuQr = {
  i: string; // identifiant de l'invitation
  n: string; // nom complet
  p: string; // téléphone
};

/** Dérive une clé de 32 octets à partir du secret, différente par usage. */
function cle(usage: string): Buffer {
  const secret = process.env.QR_SECRET_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("QR_SECRET_KEY manquante ou trop courte (32 caractères minimum).");
  }
  return createHash("sha256").update(`${usage}:${secret}`).digest();
}

/**
 * Chiffre les données de l'invité en AES-256-GCM.
 * Résultat : INV1.<base64url(iv | tag | données chiffrées)>
 * GCM authentifie aussi le contenu : un jeton modifié ou fabriqué est rejeté.
 */
export function chiffrerJeton(contenu: ContenuQr): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cle("qr"), iv);
  const donnees = Buffer.concat([
    cipher.update(JSON.stringify(contenu), "utf8"),
    cipher.final(),
  ]);
  return PREFIXE + Buffer.concat([iv, cipher.getAuthTag(), donnees]).toString("base64url");
}

/** Déchiffre un jeton. Retourne null si le jeton est invalide ou falsifié. */
export function dechiffrerJeton(jeton: string): ContenuQr | null {
  try {
    if (!jeton.startsWith(PREFIXE) || jeton.length > 1000) return null;
    const brut = Buffer.from(jeton.slice(PREFIXE.length), "base64url");
    if (brut.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", cle("qr"), brut.subarray(0, 12));
    decipher.setAuthTag(brut.subarray(12, 28));
    const clair = Buffer.concat([decipher.update(brut.subarray(28)), decipher.final()]);
    const contenu = JSON.parse(clair.toString("utf8"));
    if (typeof contenu?.i !== "string" || typeof contenu?.n !== "string" || typeof contenu?.p !== "string") {
      return null;
    }
    return contenu;
  } catch {
    return null;
  }
}

export function genererId(): string {
  return randomBytes(16).toString("base64url");
}

export function egaliteSure(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/* ---------- Session des agents d'accueil (page de scan) ---------- */

export const COOKIE_SCAN = "scan_session";
// Une fois le code PIN saisi, l'appareil reste autorisé à scanner pendant 24 h
export const DUREE_SESSION_S = 24 * 60 * 60;

export function creerSession(): string {
  const exp = Math.floor(Date.now() / 1000) + DUREE_SESSION_S;
  const sig = createHmac("sha256", cle("session")).update(String(exp)).digest("base64url");
  return `${exp}.${sig}`;
}

export function sessionValide(valeur: string | undefined): boolean {
  if (!valeur) return false;
  const [exp, sig] = valeur.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const attendu = createHmac("sha256", cle("session")).update(exp).digest("base64url");
  return egaliteSure(sig, attendu);
}
