# Invitations de mariage avec QR code à usage unique

Site Next.js (fullstack) : l'invité saisit son **nom complet** et son **numéro de téléphone**, et reçoit
aussitôt sa carte d'invitation en PNG, avec un QR code chiffré valable **une seule fois** à l'entrée.

## Fonctionnement

| Page | Rôle |
|---|---|
| `/` | Formulaire (nom + téléphone) |
| `/invitation/[id]` | Carte de l'invité : téléchargement PNG, envoi WhatsApp, copie du lien |
| `/scan` | Scanner pour les agents d'accueil (protégé par code PIN) |
| `/api/apercu?nom=...` | Aperçu de la carte avec un invité fictif (développement uniquement) |

**Sécurité du QR code**
- Contenu chiffré en **AES-256-GCM** (id + nom + téléphone) : illisible avec un scanner classique, et toute modification est détectée.
- Le jeton est enregistré en base ; au scan, le passage « non utilisé → utilisé » se fait en **une seule requête SQL atomique**. Deux agents qui scannent la même carte au même moment : un seul passe.
- Une capture d'écran partagée ne donne donc qu'**une seule entrée**.
- Un numéro = une invitation. Si la même personne refait le formulaire (carte perdue), elle retrouve **la même carte**.

## Installation locale

```bash
pnpm install
cp .env.example .env.local      # puis remplir les valeurs
pnpm db:init                    # crée la table
pnpm dev
```

Générer la clé secrète : `openssl rand -base64 48`

## Déploiement sur Vercel

1. Créer une base PostgreSQL gratuite (Neon ou Supabase) et copier son URL.
2. Importer le projet sur Vercel et ajouter les variables de `.env.example`.
3. Lancer une fois `pnpm db:init` en local avec l'URL de production dans `.env.local`.
4. Partager aux invités le lien `https://votresite.com/?k=VOTRE_INVITE_KEY` (si `INVITE_KEY` est défini).

La caméra de la page `/scan` ne fonctionne qu'en **HTTPS** (c'est le cas sur Vercel).

## Personnaliser la carte

- Textes, prénoms, date, lieu : `src/lib/config.ts`
- Photo du couple (facultative) : déposer `assets/couple.png` (idéalement détourée, fond transparent). Elle s'affiche devant le grand chiffre doré.
- Design de la carte : `src/lib/carte.tsx` (format 1080 × 1350). Vérifier le rendu sur `/api/apercu`.

## Important

- **Ne changez pas `QR_SECRET_KEY`** après l'envoi des premières cartes : elles deviendraient invalides.
- Le jour J, testez le scan avec une carte de test, puis réinitialisez-la :
  `UPDATE invitations SET utilise_le = NULL WHERE telephone = '...';`
- Liste des présents : `SELECT nom, telephone, utilise_le FROM invitations ORDER BY utilise_le;`
