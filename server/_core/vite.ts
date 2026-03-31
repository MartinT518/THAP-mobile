import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer, type UserConfig } from "vite";
import viteConfigExport from "../../vite.config";

type ResolvedServerOptions = NonNullable<UserConfig["server"]>;
type ResolvedHmrOptions = Exclude<
  ResolvedServerOptions["hmr"],
  boolean | undefined
>;

function resolveViteConfig(): UserConfig {
  if (typeof viteConfigExport === "function") {
    return viteConfigExport({ mode: "development", command: "serve" } as never) as UserConfig;
  }
  return viteConfigExport as UserConfig;
}

function resolveServerOptions(config: UserConfig): ResolvedServerOptions {
  return typeof config.server === "object" && config.server !== null
    ? config.server
    : {};
}

function resolveHmrOptions(serverOptions: ResolvedServerOptions): ResolvedHmrOptions {
  return typeof serverOptions.hmr === "object" && serverOptions.hmr !== null
    ? serverOptions.hmr
    : {};
}

export async function setupVite(app: Express, server: Server, port: number) {
  const resolved = resolveViteConfig();
  const resolvedServer = resolveServerOptions(resolved);
  const resolvedHmr = resolveHmrOptions(resolvedServer);

  const vite = await createViteServer({
    ...resolved,
    configFile: false,
    server: {
      ...resolvedServer,
      middlewareMode: true,
      allowedHosts: resolvedServer.allowedHosts ?? ["localhost", "127.0.0.1"],
      hmr: {
        ...resolvedHmr,
        server,
        clientPort: port,
      },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
