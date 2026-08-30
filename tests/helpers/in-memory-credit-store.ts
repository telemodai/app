import type { CreditTransaction } from "@/server/database/models/credit-transaction";
import type { CreditLedger, CreditStore } from "@/server/core/credit-service";

type LedgerRow = CreditTransaction;

export class InMemoryCreditStore implements CreditStore, CreditLedger {
  private botBalances = new Map<string, number>();
  private userBalances = new Map<string, number>();
  private ledger: LedgerRow[] = [];
  private nextId = 1;

  async getBotBalance(botId: string): Promise<number> {
    return this.botBalances.get(botId) ?? 0;
  }

  async getUserBalance(userId: string): Promise<number> {
    return this.userBalances.get(userId) ?? 0;
  }

  async setBotBalance(botId: string, balance: number): Promise<void> {
    this.botBalances.set(botId, balance);
  }

  async setUserBalance(userId: string, balance: number): Promise<void> {
    this.userBalances.set(userId, balance);
  }

  /** @deprecated use setBotBalance */
  async setBalance(botId: string, balance: number): Promise<void> {
    await this.setBotBalance(botId, balance);
  }

  async conditionalDebit(botId: string): Promise<number | null> {
    const current = this.botBalances.get(botId) ?? 0;
    if (current < 1) {
      return null;
    }
    const next = current - 1;
    this.botBalances.set(botId, next);
    return next;
  }

  async applyBotDelta(botId: string, amount: number): Promise<number> {
    const next = (this.botBalances.get(botId) ?? 0) + amount;
    this.botBalances.set(botId, next);
    return next;
  }

  async applyUserDelta(userId: string, amount: number): Promise<number> {
    const next = (this.userBalances.get(userId) ?? 0) + amount;
    this.userBalances.set(userId, next);
    return next;
  }

  async create(
    input: Omit<LedgerRow, "id" | "created_at">
  ): Promise<LedgerRow> {
    return this.insertLedgerRow(input);
  }

  async insertLedgerRow(
    input: Omit<LedgerRow, "id" | "created_at">
  ): Promise<LedgerRow> {
    const row: LedgerRow = {
      ...input,
      id: this.nextId++,
      created_at: new Date(),
    };
    this.ledger.push(row);
    return row;
  }

  async findDebitModeration(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<LedgerRow | null> {
    return (
      this.ledger.find(
        (row) =>
          row.bot_id === botId &&
          row.type === "debit_moderation" &&
          row.chat_id === chatId &&
          row.reference === String(messageId)
      ) ?? null
    );
  }

  async findPurchaseByProviderPaymentId(
    paymentId: string
  ): Promise<LedgerRow | null> {
    return (
      this.ledger.find(
        (row) => row.type === "purchase" && row.reference === paymentId
      ) ?? null
    );
  }

  async findByReferenceAndType(
    reference: string,
    type: CreditTransaction["type"]
  ): Promise<LedgerRow | null> {
    return (
      this.ledger.find(
        (row) => row.reference === reference && row.type === type
      ) ?? null
    );
  }

  async sumAmountByBot(botId: string): Promise<number> {
    return this.ledger
      .filter((row) => row.bot_id === botId)
      .reduce((sum, row) => sum + row.amount, 0);
  }

  async sumAmountByUser(userId: string): Promise<number> {
    return this.ledger
      .filter((row) => row.user_id === userId)
      .reduce((sum, row) => sum + row.amount, 0);
  }
}
