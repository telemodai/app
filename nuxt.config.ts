// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import pkg from "./package.json";
import { resolveAppName } from "./lib/app-config";
import { brandPublic, THEME_STORAGE_KEY } from "./lib/brand";

export default defineNuxtConfig({
  compatibilityDate: "2025-08-11",
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        {
          name: "robots",
          content: "noindex, nofollow, noarchive, nosnippet",
        },
        {
          name: "googlebot",
          content: "noindex, nofollow, noarchive, nosnippet",
        },
        {
          name: "theme-color",
          content: brandPublic.themeColor,
          id: "theme-color-meta",
        },
      ],
      link: [
        {
          rel: "icon",
          href: brandPublic.faviconIco,
          sizes: "48x48",
          id: "theme-favicon-ico",
        },
        {
          rel: "icon",
          href: brandPublic.faviconSvg,
          type: "image/svg+xml",
          id: "theme-favicon-svg",
        },
        {
          rel: "apple-touch-icon",
          href: brandPublic.appleTouchIcon,
          id: "theme-apple-touch",
        },
      ],
      script: [
        {
          innerHTML: `try{const s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(s==="dark"||s==="light")document.documentElement.dataset.theme=s}catch{}`,
          tagPosition: "head",
        },
      ],
    },
  },
  devtools: { enabled: true },
  modules: ["@nuxtjs/i18n"],
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", language: "en-US", name: "English", file: "en.json" },
      { code: "ru", language: "ru-RU", name: "Русский", file: "ru.json" },
    ],
    lazy: true,
    langDir: "locales",
    strategy: "no_prefix",
    vueI18n: "./i18n.config.ts",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_locale",
      fallbackLocale: "en",
      redirectOn: "root",
    },
    compilation: {
      strictMessage: false,
    },
  },
  runtimeConfig: {
    public: {
      appName: resolveAppName(),
      appVersion: pkg.version,
      telegramLoginBotUsername: process.env.TELEGRAM_LOGIN_BOT_USERNAME || "",
      deploymentMode: process.env.DEPLOYMENT_MODE || "self-hosted",
      baseUrl: process.env.BASE_URL || "",
    },
    llmApiKey: process.env.LLM_API_KEY,
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmModel: process.env.LLM_MODEL || "gpt-4.1-nano-2025-04-14",
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator",
    telegramLoginBotId: process.env.TELEGRAM_LOGIN_BOT_ID,
    telegramLoginClientSecret: process.env.TELEGRAM_LOGIN_CLIENT_SECRET,
  },
  routeRules: {
    "/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      },
    },
    "/api/auth/**": { cors: true },
  },
  nitro: {
    preset: "node-server",
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      "0 3 * * *": [
        "retention:user-messages",
        "retention:moderation-actions",
        "retention:moderation-decisions",
        "billing:reconcile-credits",
        "billing:reconcile-stale-payments",
      ],
    },
  },
  typescript: {
    strict: true,
  },
  devServer: {
    host: "0.0.0.0",
    port: 3001,
  },
});
