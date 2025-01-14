// ./example/plugins/logging.ts
import type { Plugin } from "../../mod.ts";
import { bold, cyan, green } from "jsr:@std/fmt/colors";
import type OakPlugin from "./oak.ts"

export default {
  name: "http_backend_logger",
  register(events) {
    events.on<[typeof OakPlugin]>("plugin:http_backend:initializing", (plugin) => {
      plugin.app.use(async (ctx, next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        console.log(
          `${green(ctx.request.method)} ${cyan(ctx.request.url.toString())} - ${
            bold(`${ms}ms`)
          }`,
        );
      });
    })
  },
} as Plugin;
