import { t } from "./i18n.js";

export const APP_CONFIG = {
  appName: "PythonStart",
  version: "1.0.0-mvp",
  defaultLocale: "uk",
};

export function initApp() {
  console.log(`${t("app.title")} (${APP_CONFIG.version}). ${t("app.ready")}`);
}
