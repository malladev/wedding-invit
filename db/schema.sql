CREATE TABLE IF NOT EXISTS invitations (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  telephone   TEXT NOT NULL UNIQUE,
  jeton       TEXT NOT NULL,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  utilise_le  TIMESTAMPTZ
);
