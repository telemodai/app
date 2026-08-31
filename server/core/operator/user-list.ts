import { desc } from "drizzle-orm";
import { users } from "@/server/database/auth-schema";
import { getDatabaseConnection } from "@/server/database/connection";
import type { AppUser } from "@/server/database/models/user";

export type UserListRow = AppUser;

export async function listUsersOperator(limit = 50): Promise<UserListRow[]> {
  const db = getDatabaseConnection().getDb();
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 200);

  const rows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(capped);

  return rows.map((row) => ({
    id: row.id,
    telegram_id: row.telegramId,
    username: row.username,
    name: row.name,
    photo_url: row.photoUrl,
    referral_code: row.referralCode,
    credit_balance: row.creditBalance,
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

export function formatUsersList(users: UserListRow[]): string {
  if (users.length === 0) {
    return "No users found.";
  }

  const header = [
    pad("id", 38),
    pad("telegram_id", 14),
    pad("username", 16),
    pad("name", 20),
    pad("wallet", 8),
    "created",
  ].join("  ");

  const lines = users.map((user) => {
    const username = user.username ? `@${user.username}` : "—";
    const created = user.created_at.toISOString().slice(0, 10);
    return [
      pad(user.id, 38),
      pad(String(user.telegram_id), 14),
      pad(username, 16),
      pad(user.name, 20),
      pad(String(user.credit_balance), 8),
      created,
    ].join("  ");
  });

  return [header, ...lines].join("\n");
}
