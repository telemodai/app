import { desc } from "drizzle-orm";
import { getDatabaseConnection } from "@/server/database/connection";
import type { PromoCode } from "@/server/database/models/promo-code";
import { promoCodes } from "@/server/database/schema";
import { isPromoCodeCurrentlyValid } from "@/server/database/repositories/promo-code-repository";

export async function listPromoCodesOperator(
  limit = 50
): Promise<PromoCode[]> {
  const db = getDatabaseConnection().getDb();
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 200);

  const rows = await db
    .select()
    .from(promoCodes)
    .orderBy(desc(promoCodes.createdAt))
    .limit(capped);

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    discount_percent: row.discountPercent,
    is_active: row.isActive,
    expires_at: row.expiresAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }));
}

function pad(value: string, width: number): string {
  if (value.length >= width) {
    return value.slice(0, width - 1) + "…";
  }
  return value.padEnd(width);
}

export function formatPromoCodesList(promos: PromoCode[]): string {
  if (promos.length === 0) {
    return "No promo codes found.";
  }

  const now = new Date();
  const header = [
    pad("id", 6),
    pad("code", 14),
    pad("percent", 8),
    pad("active", 8),
    pad("valid_now", 10),
    pad("expires", 22),
    "created",
  ].join("  ");

  const lines = promos.map((promo) => {
    const expires = promo.expires_at
      ? new Date(promo.expires_at).toISOString().slice(0, 19)
      : "(none)";
    const created = promo.created_at.toISOString().slice(0, 10);
    const validNow = isPromoCodeCurrentlyValid(promo, now) ? "yes" : "no";

    return [
      pad(String(promo.id), 6),
      pad(promo.code, 14),
      pad(String(promo.discount_percent), 8),
      pad(promo.is_active ? "yes" : "no", 8),
      pad(validNow, 10),
      pad(expires, 22),
      created,
    ].join("  ");
  });

  return [header, ...lines].join("\n");
}
