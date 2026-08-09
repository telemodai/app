import { resolveDeploymentMode } from "@/server/core/deployment-mode";

export default defineNitroPlugin(() => {
  resolveDeploymentMode();
});
