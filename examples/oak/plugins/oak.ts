// ./examples/oak/plugins/oak.ts
import type { Plugin } from "../../../mod.ts";
import { Application } from "jsr:@oak/oak";
import { bold, yellow } from "jsr:@std/fmt/colors";

export default {
  name: "http_backend",
  app: new Application(),
  register(events) {
    events.on({
      condition: "single",
      events: ["core.initialized"],
      listener: () => {
        this.app.listen("0.0.0.0:8080");
        console.log(
          bold("🚀 Server is running on ") +
            yellow(`http://0.0.0.0:8080`),
        );
      },
    });
  },
  initialize() {
    this.app.use(async (ctx, next) => {
      ctx.response.body = "Hello, World!";
      await next();
    });
  },
} as Plugin & { app: Application };
