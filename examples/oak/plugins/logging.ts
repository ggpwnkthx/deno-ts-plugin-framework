// ./examples/oak/plugins/logging.ts
import type { Plugin } from "../../../mod.ts";
import { bold, cyan, green } from "jsr:@std/fmt/colors";
import type { Application } from "jsr:@oak/oak";

export default {
  name: "http_backend_logger",
  register(events) {
    events.on({
      condition: "any",
      events: [
        "plugin.http_backend.initialized",
        "plugin.http_backend_errors.ready",
      ],
      listener: (plugins) => {
        const { app } = plugins.get("http_backend") as Plugin & {
          app: Application;
        };
        app.use(async (ctx, next) => {
          const start = Date.now();
          await next();
          const ms = Date.now() - start;
          console.log(
            `${green(ctx.request.method)} ${
              cyan(ctx.request.url.toString())
            } - ${bold(`${ms}ms`)}`,
          );
        });
      },
    });
  },
} as Plugin;
