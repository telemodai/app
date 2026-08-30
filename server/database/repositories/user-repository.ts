import { eq, sql } from "drizzle-orm";
import { getDatabaseConnection } from "@/server/database/connection";
import { users } from "@/server/database/auth-schema";
import type { AppUser, SessionUser } from "@/server/database/models/user";
import { generateReferralCode } from "@/server/core/referral-code";

function toAppUser(row: typeof users.$inferSelect): AppUser {
  return {
    id: row.id,
    telegram_id: row.telegramId,
    username: row.username,
    name: row.name,
    photo_url: row.photoUrl,
    referral_code: row.referralCode,
    credit_balance: row.creditBalance,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toSessionUser(user: AppUser): SessionUser {
  return {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    name: user.name,
    photo_url: user.photo_url,
  };
}

export interface TelegramUserClaims {
  telegramId: number;
  username?: string | null;
  name: string;
  photoUrl?: string | null;
}

export class UserRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findById(id: string): Promise<AppUser | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? toAppUser(row) : null;
  }

  async findByTelegramId(telegramId: number): Promise<AppUser | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    return row ? toAppUser(row) : null;
  }

  async findByReferralCode(code: string): Promise<AppUser | null> {
    const normalized = code.trim().toUpperCase();
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.referralCode, normalized))
      .limit(1);
    return row ? toAppUser(row) : null;
  }

  async getCreditBalance(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return row?.creditBalance ?? 0;
  }

  async applyCreditDelta(userId: string, amount: number): Promise<number> {
    const updated = await this.db
      .update(users)
      .set({
        creditBalance: sql`${users.creditBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ creditBalance: users.creditBalance });

    if (updated.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    return updated[0]!.creditBalance;
  }

  async ensureReferralCode(userId: string): Promise<string> {
    const existing = await this.findById(userId);
    if (existing?.referral_code) {
      return existing.referral_code;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateReferralCode();
      try {
        const [row] = await this.db
          .update(users)
          .set({ referralCode: code, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning({ referralCode: users.referralCode });

        if (row?.referralCode) {
          return row.referralCode;
        }
      } catch {
        // Unique collision on referral_code — retry with a new code.
      }
    }

    throw new Error(`Failed to assign referral code for user ${userId}`);
  }

  async upsertFromTelegram(
    id: string,
    claims: TelegramUserClaims
  ): Promise<AppUser> {
    const now = new Date();
    const [row] = await this.db
      .insert(users)
      .values({
        id,
        telegramId: claims.telegramId,
        username: claims.username ?? null,
        name: claims.name,
        photoUrl: claims.photoUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          username: claims.username ?? null,
          name: claims.name,
          photoUrl: claims.photoUrl ?? null,
          updatedAt: now,
        },
      })
      .returning();

    const user = toAppUser(row);
    const code = await this.ensureReferralCode(user.id);
    return { ...user, referral_code: code };
  }
}
