import { describe, expect, test } from "bun:test";
import { Writable } from "node:stream";
import pino from "pino";

describe("logger error serialization", () => {
  test("serializes Error on error and err keys", () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });

    const log = pino(
      {
        serializers: {
          err: pino.stdSerializers.err,
          error: pino.stdSerializers.err,
        },
      },
      stream
    );

    const cause = new Error("telegram timeout");
    log.warn({ error: cause, botId: "demo" }, "Failed to fetch bot profile photos");

    const entry = JSON.parse(lines[0]!);
    expect(entry.error.message).toBe("telegram timeout");
    expect(typeof entry.error.stack).toBe("string");
    expect(entry.botId).toBe("demo");
  });
});
