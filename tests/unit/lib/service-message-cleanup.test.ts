import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SERVICE_MESSAGE_CLEANUP,
  normalizeServiceMessageCleanup,
} from "@/lib/service-message-cleanup";

describe("normalizeServiceMessageCleanup", () => {
  test("defaults for invalid input", () => {
    expect(normalizeServiceMessageCleanup(null)).toEqual(
      DEFAULT_SERVICE_MESSAGE_CLEANUP
    );
    expect(normalizeServiceMessageCleanup("bad")).toEqual(
      DEFAULT_SERVICE_MESSAGE_CLEANUP
    );
  });

  test("disabled clears types", () => {
    expect(
      normalizeServiceMessageCleanup({
        enabled: false,
        types: ["member_joined"],
      })
    ).toEqual({ enabled: false, types: [] });
  });

  test("enabled keeps known types only", () => {
    expect(
      normalizeServiceMessageCleanup({
        enabled: true,
        types: ["member_joined", "unknown", "member_left", "member_joined"],
      })
    ).toEqual({
      enabled: true,
      types: ["member_joined", "member_left"],
    });
  });
});
