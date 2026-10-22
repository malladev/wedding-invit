/** Nettoie et valide le nom complet. Retourne null si invalide. */
export function normaliserNom(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const nom = valeur.trim().replace(/\s+/g, " ");
  if (nom.length < 3 || nom.length > 60) return null;
  if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(nom)) return null;
  return nom;
}

/**
 * Normalise le numéro : supprime espaces, points, tirets, parenthèses.
 * Accepte un format local (8 à 10 chiffres) ou international (+223..., 00223...).
 */
export function normaliserTelephone(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  let tel = valeur.trim().replace(/[\s.\-()]/g, "");
  if (tel.startsWith("00")) tel = "+" + tel.slice(2);
  if (!/^\+?\d{8,15}$/.test(tel)) return null;
  return tel;
}

/** Masque le numéro pour l'affichage au scan : +223 •••• 45 67 ou •••• 45 67 */
export function masquerTelephone(tel: string): string {
  const indicatif = tel.startsWith("+") && tel.length > 10 ? tel.slice(0, 4) + " " : "";
  return `${indicatif}•••• ${tel.slice(-4, -2)} ${tel.slice(-2)}`;
}
