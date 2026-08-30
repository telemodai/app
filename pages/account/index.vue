<script setup lang="ts">
const config = useRuntimeConfig();

if (config.public.deploymentMode !== "saas") {
  await navigateTo("/");
}

await navigateTo("/account/billing");
</script>
