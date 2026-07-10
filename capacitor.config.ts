import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vijapurainfotech.vitrewards",
  appName: "VIT Rewards",

  server: {
    url: "http://192.168.1.10:3000",
    cleartext: true
  }
};

export default config;