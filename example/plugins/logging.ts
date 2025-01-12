// ./plugins/logging.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { bold, cyan, green } from "jsr:@std/fmt/colors";
import app from "./oak.ts";
export default {
  name: "oak_logging",
  version: "0.0.1",
  dependsOn: [
    { name: "oak" },
  ],
  exports: undefined,
  init() {
    app.exports.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(
        `${green(ctx.request.method)} ${cyan(ctx.request.url.toString())} - ${
          bold(`${ms}ms`)
        }`,
      );
    });
  },
} satisfies Plugin;