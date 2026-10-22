import "server-only";
import { Pool } from "pg";

const globalPourPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalPourPool.pool ??
  new Pool({
    // STORAGE_DATABASE_URL : nom créé par l'intégration Neon de Vercel avec le préfixe « STORAGE »
    connectionString: process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalPourPool.pool = pool;

export type Invitation = {
  id: string;
  nom: string;
  telephone: string;
  jeton: string;
  cree_le: Date;
  utilise_le: Date | null;
};
