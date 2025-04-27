import { defineManifest } from "@crxjs/vite-plugin";
import packageData from "../package.json";

export default defineManifest({
  name: packageData.displayName || packageData.name,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: "img/icon-16.png",
    32: "img/icon-32.png",
    48: "img/icon-48.png",
    128: "img/icon-128.png",
  },
  action: {
    default_popup: "popup.html",
    default_icon: "img/icon-48.png",
  },
  web_accessible_resources: [
    {
      resources: ["img/icon-16.png", "img/icon-32.png", "img/icon-48.png", "img/icon-128.png"],
      matches: ["<all_urls>"],
    }
  ],
  permissions: [
    'storage',
    'notifications'
  ],
  host_permissions: [
    "http://localhost:5175/*",
    "https://push2.eastmoney.com/*",
    "https://searchapi.eastmoney.com/*",
    "https://hq.sinajs.cn/*",
    "https://suggest3.sinajs.cn/*"
  ],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_page: "options.html",
});
