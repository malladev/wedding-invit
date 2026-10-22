import "server-only";
import { Pool } from "pg";

const globalPourPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalPourPool.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
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
