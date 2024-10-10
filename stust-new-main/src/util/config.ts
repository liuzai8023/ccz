import { request } from "./request";

interface AppConfig {
  [key: string]: string | boolean | number | undefined;
}
export const appConfig: AppConfig = {};

export async function initAppConfig() {
  const res = await request({
    url: "/util/app-config",
  });
  Object.assign(appConfig, res.data);
  return appConfig;
}

export async function getAppConfig(key: string) {
  if (Object.keys(appConfig).length === 0) {
    await initAppConfig();
  }
  return appConfig[key];
}
