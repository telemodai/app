export const SERVICE_MESSAGE_KIND_IDS = [
  "member_joined",
  "member_left",
] as const;

export type ServiceMessageKindId = (typeof SERVICE_MESSAGE_KIND_IDS)[number];

export type ServiceMessageCleanupSettings = {
  enabled: boolean;
  types: ServiceMessageKindId[];
};

export const DEFAULT_SERVICE_MESSAGE_CLEANUP: ServiceMessageCleanupSettings = {
  enabled: false,
  types: [],
};

/** Normalize API/DB payload; unknown kind ids are dropped. */
export function normalizeServiceMessageCleanup(
  input: unknown
): ServiceMessageCleanupSettings {
  if (!input || typeof input !== "object") {
    return DEFAULT_SERVICE_MESSAGE_CLEANUP;
  }

  const record = input as Record<string, unknown>;
  const enabled = record.enabled === true;
  if (!enabled) {
    return { enabled: false, types: [] };
  }

  const rawTypes = Array.isArray(record.types) ? record.types : [];
  const types = [
    ...new Set(
      rawTypes.filter(
        (value): value is ServiceMessageKindId =>
          typeof value === "string" &&
          (SERVICE_MESSAGE_KIND_IDS as readonly string[]).includes(value)
      )
    ),
  ];

  return { enabled: true, types };
}
