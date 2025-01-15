// ./examples/oak/plugins/errors.ts
import type { Plugin } from "../../../mod.ts";
import { bold, red } from "jsr:@std/fmt/colors";
import { HttpError } from "jsr:@oak/commons@1/http_errors";
import { Status } from "jsr:@oak/commons@1/status";
import type { Application } from "jsr:@oak/oak";

export default {
  name: "http_backend_errors",
  register(events) {
    events.on({
      condition: "single",
      events: ["plugin.http_backend.initializing"],
      listener: (plugins) => {
        const { app } = plugins.get("http_backend") as Plugin & {
          app: Application;
        };
        app.use(async (ctx, next) => {
          try {
            await next();
          } catch (e) {
            if (e instanceof HttpError) {
              ctx.response.status = e.status;
              ctx.response.body = e.expose
                ? `${e.status} - ${e.message}`
                : `${e.status} - ${Status[e.status]}`;
            } else {
              ctx.response.status = 500;
              ctx.response.body = "500 - Internal Server Error";
            }
            console.error(red(bold("Error: ")), e);
          }
        });
        events.emit("plugin.http_backend_errors.ready");
      },
    });
  },
} as Plugin;
