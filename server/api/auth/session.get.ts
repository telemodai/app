import { getSessionUser } from "@/server/utils/session";

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event);
  return {
    user,
    session: user ? { user } : null,
  };
});
