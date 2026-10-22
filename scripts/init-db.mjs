// Crée la table des invitations. Usage : pnpm db:init
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

// Même priorité que Next.js : .env.local l'emporte sur .env
for (const fichier of [".env.local", ".env"]) {
  if (existsSync(fichier)) process.loadEnvFile(fichier);
}

const url = process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante (fichier .env.local ou .env).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
await client.end();
console.log("Table « invitations » prête.");
