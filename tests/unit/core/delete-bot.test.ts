import { describe, expect, test } from "bun:test";
import {
  deleteBotPermanently,
  DeleteBotError,
} from "@/server/core/delete-bot";
import { enforceBotAccess } from "@/server/utils/bot-access";
import { InMemoryBotRepository } from "@/tests/helpers/in-memory-bot-repository";
import { TEST_OWNER_USER_ID } from "@/tests/helpers/constants";

describe("deleteBotPermanently", () => {
  test("soft-deletes bot after best-effort webhook removal", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "delete-me",
      name: "Delete Me",
      token: "secret-token",
    });

    const deleteWebhookCalls: string[] = [];
    let reclaimed = false;

    await deleteBotPermanently("delete-me", {
      findByIdWithToken: (id) => botRepo.findByIdWithTokenIncludingDeleted(id),
      softDeleteBot: (id) => botRepo.softDelete(id),
      reclaimFromBot: async () => {
        reclaimed = true;
      },
      deleteWebhook: async (token) => {
        deleteWebhookCalls.push(token);
      },
      fetchFn: fetch,
    });

    expect(deleteWebhookCalls).toEqual(["secret-token"]);
    expect(reclaimed).toBe(true);
    expect(await botRepo.findById("delete-me")).toBeNull();
    const deleted = await botRepo.findByIdWithTokenIncludingDeleted("delete-me");
    expect(deleted?.deleted_at).toBeDefined();
    expect(deleted?.token).toBeUndefined();
  });

  test("still soft-deletes bot when webhook removal fails", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "webhook-fail",
      name: "Webhook Fail",
      token: "bad-token",
    });

    await deleteBotPermanently("webhook-fail", {
      findByIdWithToken: (id) => botRepo.findByIdWithTokenIncludingDeleted(id),
      softDeleteBot: (id) => botRepo.softDelete(id),
      reclaimFromBot: async () => {},
      deleteWebhook: async () => {
        throw new Error("Telegram unavailable");
      },
      fetchFn: fetch,
    });

    expect(await botRepo.findById("webhook-fail")).toBeNull();
  });

  test("throws 404 when bot does not exist", async () => {
    const botRepo = new InMemoryBotRepository();

    await expect(
      deleteBotPermanently("missing", {
        findByIdWithToken: (id) => botRepo.findByIdWithTokenIncludingDeleted(id),
        softDeleteBot: (id) => botRepo.softDelete(id),
        reclaimFromBot: async () => {},
        deleteWebhook: async () => {},
        fetchFn: fetch,
      })
    ).rejects.toBeInstanceOf(DeleteBotError);
  });

  test("manager can pass member access gate without owner role", () => {
    expect(enforceBotAccess("manager")).toBe("manager");
    expect(enforceBotAccess("owner")).toBe("owner");
  });
});
