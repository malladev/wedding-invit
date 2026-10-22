import { pool } from "@/lib/db";
import { genererCarte } from "@/lib/carte";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(id)) return new Response("Introuvable", { status: 404 });

  const { rows } = await pool.query<{ nom: string; jeton: string }>(
    "SELECT nom, jeton FROM invitations WHERE id = $1",
    [id],
  );
  if (!rows[0]) return new Response("Invitation introuvable", { status: 404 });

  const image = await genererCarte(rows[0]);
  const telecharger = new URL(req.url).searchParams.has("telecharger");
  const slug = rows[0].nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const nomFichier = `invitation-${slug}.png`;

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Robots-Tag", "noindex");
  if (telecharger) headers.set("Content-Disposition", `attachment; filename="${nomFichier}"`);

  return new Response(image.body, { status: 200, headers });
}
