# Déployer le site sur Vercel

Ce guide met le site en ligne gratuitement : le site est hébergé sur **Vercel** et la base de données sur **Neon** (PostgreSQL).
Comptez environ 20 minutes.

À la fin, vous aurez :
- une adresse en HTTPS, par exemple `https://awa-moussa.vercel.app`. Le HTTPS est obligatoire pour la caméra du scanner ;
- le lien à envoyer aux invités : l'adresse du site, tout simplement.

---

## 1. Prérequis

- Un compte **GitHub** (gratuit) : <https://github.com>
- Un compte **Vercel** (gratuit, se connecter avec GitHub) : <https://vercel.com>
- Le projet poussé sur un dépôt GitHub, **privé de préférence** :

  ```bash
  git init
  git add .
  git commit -m "Premier commit"
  git branch -M main
  git remote add origin https://github.com/UTILISATEUR/invitation-mariage.git
  git push -u origin main
  ```

  > Vérifiez sur GitHub que les fichiers `.env` et `.env.local` **n'apparaissent pas** dans le dépôt.
  > Ils sont exclus par `.gitignore`, mais contiennent vos secrets : s'ils ont été poussés, changez toutes les valeurs.

---

## 2. Créer le projet sur Vercel

1. Sur <https://vercel.com/new>, cliquez sur **Import** à côté du dépôt `invitation-mariage`.
2. Vercel détecte **Next.js** et **pnpm** tout seul : ne modifiez ni la *Build Command* ni l'*Install Command*.
3. Ouvrez **Environment Variables** et ajoutez pour l'instant cette seule variable :

   | Nom | Valeur |
   |---|---|
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` |

   Elle force Vercel à utiliser la même version de pnpm qu'en local : `pnpm@12.14.0`, déclarée dans le champ `packageManager` de `package.json`.
   Sans elle, Vercel choisit pnpm 9 ou 10 d'après le lockfile.
4. Cliquez sur **Deploy**. Ce premier déploiement réussit, mais le site **ne fonctionne pas encore** : il manque la base et les autres secrets.
   C'est normal, on les ajoute aux étapes suivantes.

---

## 3. Créer la base de données (Neon)

### Option A : depuis Vercel (le plus simple)

1. Dans le projet Vercel : onglet **Storage**, puis **Create Database**, puis **Neon** (Serverless Postgres).
2. Choisissez la région la plus proche de vos invités, par exemple **Europe (Frankfurt)** ou **Paris**, puis validez.
3. Connectez la base au projet, pour les environnements **Production** et **Preview**.
4. Allez dans **Settings → Environment Variables** et vérifiez que `DATABASE_URL` y figure.
   Vercel l'a ajoutée automatiquement, avec d'autres variables `POSTGRES_*` qui ne servent pas à ce projet.
   Si vous avez donné le préfixe `STORAGE` à la connexion, la variable s'appelle **`STORAGE_DATABASE_URL`**.
   Le site la reconnaît aussi : rien à renommer.

### Option B : directement sur Neon

1. Créez un projet sur <https://neon.tech> en choisissant une région en Europe.
2. Copiez la **connection string**. Elle ressemble à :
   `postgresql://utilisateur:motdepasse@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Gardez `?sslmode=require` à la fin : en ligne, la connexion doit être chiffrée.

> **Supabase** marche aussi. Utilisez alors l'URL du **Transaction pooler** (port `6543`), mieux adaptée à Vercel.

**Conseil :** réglez la région des fonctions Vercel au plus près de la base, dans **Settings → Functions → Function Region**.
Par exemple `fra1` (Francfort) si la base est à Francfort. Les pages répondront plus vite.

---

## 4. Ajouter les variables d'environnement

Dans **Settings → Environment Variables**, ajoutez les variables suivantes pour l'environnement **Production** :

| Nom | Valeur | Remarque |
|---|---|---|
| `DATABASE_URL` | URL de l'étape 3 | Déjà présente avec l'option A (ou sous le nom `STORAGE_DATABASE_URL`) |
| `QR_SECRET_KEY` | une **nouvelle** clé (voir ci-dessous) | **Ne plus jamais la changer** une fois les cartes envoyées |
| `SCAN_PIN` | un code de 8 chiffres ou plus | À donner uniquement aux agents d'accueil |
| `MAX_INVITATIONS` | `0` ou le nombre d'invités prévus | `0` = illimité |
| `ALLOW_PREVIEW` | `0` | Laissez `0` en production |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Déjà ajoutée à l'étape 2 |

Générez les secrets dans un terminal :

```bash
# QR_SECRET_KEY
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# SCAN_PIN (8 chiffres)
node -e "console.log(require('crypto').randomInt(10000000, 100000000))"
```

> Utilisez des valeurs **différentes de celles de votre `.env` local**.
> Gardez une copie de `QR_SECRET_KEY` en lieu sûr, par exemple dans un gestionnaire de mots de passe.
> Si vous la perdez ou la changez, toutes les cartes déjà envoyées deviennent invalides.

**Important :** Vercel n'applique les nouvelles variables qu'au **prochain déploiement**.
Après les avoir ajoutées, allez dans **Deployments**, ouvrez le menu `⋯` du dernier déploiement, puis **Redeploy**.

---

## 5. Créer la table dans la base de production

C'est à faire **une seule fois**. Choisissez l'une des deux méthodes.

### Méthode 1 : éditeur SQL de Neon (sans rien installer)

Dans la console Neon, ouvrez **SQL Editor**, collez le contenu de `db/schema.sql` puis cliquez sur **Run** :

```sql
CREATE TABLE IF NOT EXISTS invitations (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  telephone   TEXT NOT NULL UNIQUE,
  jeton       TEXT NOT NULL,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  utilise_le  TIMESTAMPTZ
);
```

### Méthode 2 : depuis votre ordinateur

1. Créez un fichier `.env.local` contenant **uniquement** l'URL de production :
   ```
   DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
   ```
2. Lancez :
   ```bash
   pnpm db:init
   ```
   Le message attendu est `Table « invitations » prête.`
3. **Supprimez ensuite `.env.local`.** Il passe avant `.env` : tant qu'il existe, votre `pnpm dev` local utilise la base de **production**.

---

## 6. Vérifier que tout fonctionne

Sur l'adresse Vercel (`https://….vercel.app`) :

- [ ] La page d'accueil s'affiche avec ses animations.
- [ ] La création d'une carte de test fonctionne : les confettis apparaissent et la carte PNG se télécharge.
- [ ] **Sur un téléphone**, le bouton flottant en bas à droite demande le code PIN, puis ouvre la caméra.
- [ ] Le scan de la carte de test affiche **« Accès autorisé »**. Un deuxième scan affiche **« Carte déjà utilisée »**.
- [ ] Un nouveau clic sur le bouton flottant ouvre le scanner **sans redemander le code** (mémorisé 24 h).
- [ ] L'onglet **Invités** affiche la carte de test comme « Arrivé·e », avec l'heure du scan.

Supprimez ensuite la carte de test dans l'éditeur SQL de Neon. Le numéro est enregistré sans espaces :

```sql
DELETE FROM invitations WHERE telephone = '+22370000000';
```

---

## 7. Partager le lien

Envoyez aux invités, par WhatsApp, SMS ou e-mail :

```
https://VOTRE-SITE.vercel.app
```

**Nom de domaine personnalisé** (facultatif) : dans **Settings → Domains**, ajoutez par exemple `awa-et-moussa.com` et suivez les instructions DNS.
Le certificat HTTPS est fourni automatiquement.

---

## Mettre à jour le site

- **Modifier le code** : chaque `git push` sur la branche `main` redéploie automatiquement le site.
- **Modifier une variable** : changez-la dans *Settings → Environment Variables*, puis faites **Redeploy**.
- **Ne modifiez jamais `QR_SECRET_KEY`** une fois les premières cartes envoyées.
- Les autres valeurs (`SCAN_PIN`, `MAX_INVITATIONS`) peuvent changer sans casser les cartes existantes.

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le build échoue sur la version de pnpm | `ENABLE_EXPERIMENTAL_COREPACK` manquante | L'ajouter avec la valeur `1`, puis faire Redeploy |
| Erreur 500 à la création d'une carte | `QR_SECRET_KEY` absente ou trop courte (moins de 32 caractères) | Ajouter la clé, puis faire Redeploy |
| Erreur 500 ou `ECONNREFUSED` / `getaddrinfo` dans les logs | `DATABASE_URL` absente ou incorrecte | Vérifier l'URL et le `?sslmode=require` |
| `relation "invitations" does not exist` | La table n'a pas été créée | Refaire l'étape 5 |
| « Code incorrect » au scanner alors que le code est bon | `SCAN_PIN` modifié sans redéploiement | Faire Redeploy |
| La caméra ne s'ouvre pas | Permission refusée ou site en HTTP | Autoriser la caméra dans le navigateur, et utiliser l'adresse en `https://` |
| Le code PIN est redemandé avant 24 h | Cookies effacés, navigation privée ou autre navigateur | Normal : la mémorisation est propre à chaque navigateur |

Les erreurs du serveur sont visibles dans Vercel : **Logs**, ou **Deployments → (déploiement) → Functions**.
