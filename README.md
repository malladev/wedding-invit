# Invitations de mariage avec QR code à usage unique

Site Next.js 16 (fullstack) + PostgreSQL. L'invité saisit son **nom complet** et son **numéro de téléphone**
et reçoit aussitôt sa carte d'invitation en PNG. La carte porte un QR code chiffré valable **une seule fois** à l'entrée.

## Fonctionnement

| Page | Rôle |
|---|---|
| `/` | Formulaire (nom + téléphone), avec animations d'entrée |
| `/invitation/[id]` | Carte de l'invité : téléchargement PNG, envoi WhatsApp, copie du lien. Des confettis s'affichent juste après la génération. |
| `/scan` | Scanner des agents d'accueil, protégé par un code PIN |
| `/api/apercu?nom=...` | Aperçu de la carte avec un invité fictif (développement uniquement) |

Un **bouton flottant** (en bas à droite, sur toutes les pages sauf `/scan`) ouvre le scanner.
Il demande le code `SCAN_PIN` une seule fois. L'appareil reste ensuite autorisé **24 h**, sans redemander le code.

### Sécurité

- **QR code chiffré** en AES-256-GCM (id + nom + téléphone) : illisible avec un scanner classique, et toute modification est détectée.
- **Usage unique** : au scan, la carte passe de « non utilisée » à « utilisée » en **une seule requête SQL atomique**.
  Si deux agents scannent la même carte au même moment, un seul passe. Une capture d'écran partagée ne donne donc qu'**une seule entrée**.
- **Un numéro = une invitation.** Si la même personne refait le formulaire (carte perdue), elle retrouve **la même carte**.
- **Session des agents** : après le bon code PIN, le serveur dépose un cookie signé (HMAC), `HttpOnly`, valable 24 h.
  Le code PIN lui-même n'est jamais stocké dans le navigateur.
- **Lien d'invitation** : si `INVITE_KEY` est défini, seuls les visiteurs venant du lien `/?k=CLE` peuvent créer une carte.
  Cette vérification est **désactivée en développement** (`pnpm dev`), pour pouvoir tester directement sur `http://localhost:3000`.

## Installation locale

Prérequis : Node.js 20.9 ou plus récent, pnpm, et un serveur PostgreSQL local.

```bash
pnpm install
cp .env.example .env            # puis remplir les valeurs (voir ci-dessous)
pnpm db:init                    # crée la table « invitations »
pnpm dev                        # http://localhost:3000
```

`pnpm db:init` lit `.env.local` puis `.env`. Si une variable est définie dans les deux fichiers, la valeur de `.env.local` l'emporte, comme dans Next.js.

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | oui | URL PostgreSQL. En local : `postgresql://postgres:MOTDEPASSE@localhost:5432/wedding` (sans `sslmode`). En ligne : ajouter `?sslmode=require`. |
| `QR_SECRET_KEY` | oui | Clé de chiffrement des QR codes, 32 caractères minimum. Générer avec `openssl rand -base64 48`. |
| `SCAN_PIN` | oui | Code des agents d'accueil. Le champ de saisie affiche un clavier numérique : préférez 8 chiffres ou plus. |
| `INVITE_KEY` | non | Clé du lien d'invitation (`/?k=CLE`). Vide = tout le monde peut créer une carte. |
| `MAX_INVITATIONS` | non | Nombre maximum d'invitations (`0` = illimité). |
| `ALLOW_PREVIEW` | non | `1` pour activer `/api/apercu` en production. |

Sans `openssl`, cette commande génère une clé équivalente avec Node.js :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Déploiement

Le guide pas à pas est dans **[DEPLOIEMENT-VERCEL.md](DEPLOIEMENT-VERCEL.md)**.

La caméra de la page `/scan` ne fonctionne qu'en **HTTPS** (c'est le cas sur Vercel) ou sur `localhost`.

## Personnaliser

- **Textes, prénoms, date, lieu** : `src/lib/config.ts`
- **Photo du couple** (facultative) : déposer `assets/couple.png`, idéalement détourée sur fond transparent. Elle s'affiche devant le grand chiffre doré.
- **Design de la carte PNG** : `src/lib/carte.tsx` (format 1080 × 1350). Vérifier le rendu sur `/api/apercu`.
- **Design du site** (couleurs, animations, bouton flottant) : `src/app/globals.css`.
  Les couleurs sont regroupées en haut du fichier (`--or`, `--fond`…).
- **Décor animé** (halos dorés, paillettes) : `src/app/Decor.tsx`
- **Confettis** (couleurs, durée) : `src/app/invitation/[id]/CarteRevelee.tsx`
- **Durée de mémorisation du code PIN** : `DUREE_SESSION_S` dans `src/lib/crypto.ts`

Si l'appareil est réglé sur « réduire les animations », les animations et les confettis sont désactivés.

## Le jour J

- **Ne changez pas `QR_SECRET_KEY`** après l'envoi des premières cartes : elles deviendraient toutes invalides.
- Testez le scan avec une carte de test, puis réinitialisez-la. Le numéro est enregistré sans espaces ni points (ex. `+22370000000`) :
  ```sql
  UPDATE invitations SET utilise_le = NULL WHERE telephone = '+22370000000';
  ```
- Liste des présents :
  ```sql
  SELECT nom, telephone, utilise_le FROM invitations WHERE utilise_le IS NOT NULL ORDER BY utilise_le;
  ```
- Nombre d'invitations et d'entrées :
  ```sql
  SELECT count(*) AS invitations, count(utilise_le) AS entrees FROM invitations;
  ```
