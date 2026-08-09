import { getHealthPayload } from "@/server/utils/health";

export default defineEventHandler(() => {
  return getHealthPayload();
});
