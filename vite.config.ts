import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

/**
 * Packages that browser dependencies import and that must be pre-bundled from
 * their importer. vinext 1.3.1 also applies Next's server-external defaults to
 * the client optimizer's `exclude`, so `@walletconnect/logger` (via Privy)
 * keeps a bare `pino` import that strict pnpm cannot resolve from the project
 * root. Only the client environment is changed; server environments are not.
 */
const CLIENT_PREBUNDLED_SERVER_EXTERNALS = ["pino"];

function prebundleClientServerExternals(): Plugin {
  return {
    name: "ori:prebundle-client-server-externals",
    enforce: "post",
    configEnvironment(name, config) {
      const exclude = config.optimizeDeps?.exclude;
      if (name !== "client" || !exclude) return;
      config.optimizeDeps!.exclude = exclude.filter(
        (id) => !CLIENT_PREBUNDLED_SERVER_EXTERNALS.includes(id),
      );
    },
  };
}

export default defineConfig({
  plugins: [
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
    prebundleClientServerExternals(),
  ],
});
