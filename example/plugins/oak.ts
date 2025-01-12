// ./plugins/oak.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { Application } from "jsr:@oak/oak";
import { bold, yellow } from "jsr:@std/fmt/colors";
export default {
  name: "oak", // Unique name for the plugin
  version: "0.0.1",
  exports: new Application(), // Standard property name for accessible objects
  init() {
    this.exports.use(async (ctx, next) => {
      ctx.response.body = "Hello, World!";
      await next();
    });
  },
  afterInitAll(context) {
    this.exports.listen(context.config.server);
    return bold("🚀 Server is running on ") +
      yellow(`http://${context.config.server}`);
  },
} satisfies Plugin<Application>;