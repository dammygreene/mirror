import { createDirectDataController } from "@opendatalabs/vana-sdk/server";
import type { DirectDataController } from "@opendatalabs/vana-sdk/server";
import { SOURCES, type MirrorSource } from "./constants";

const sourceConfig = {
  spotify: {
    connectorSource: process.env.VANA_SPOTIFY_CONNECTOR_SOURCE ?? "spotify",
    scopes: [SOURCES.spotify],
  },
  youtube: {
    connectorSource: process.env.VANA_YOUTUBE_CONNECTOR_SOURCE ?? "youtube",
    scopes: [SOURCES.youtube],
  },
} satisfies Record<MirrorSource, { connectorSource: string; scopes: string[] }>;

const controllers = new Map<MirrorSource, DirectDataController>();

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the Vana connect flow`);
  return value;
}

export function getVanaController(source: MirrorSource) {
  const cached = controllers.get(source);
  if (cached) return cached;

  const config = sourceConfig[source];
  const controller = createDirectDataController({
    env: process.env.VANA_ENV === "dev" ? "dev" : "production",
    network: process.env.VANA_NETWORK === "moksha" ? "moksha" : "mainnet",
    appPrivateKey: requiredEnv("VANA_APP_PRIVATE_KEY"),
    app: {
      id: process.env.VANA_APP_ID ?? "mirror",
      name: "Mirror",
      homepageUrl: requiredEnv("VANA_APP_URL"),
    },
    source: config.connectorSource,
    scopes: config.scopes,
  });

  controllers.set(source, controller);
  return controller;
}

export function getVanaReturnUrl() {
  return `${requiredEnv("VANA_APP_URL").replace(/\/$/, "")}/connect/return`;
}
