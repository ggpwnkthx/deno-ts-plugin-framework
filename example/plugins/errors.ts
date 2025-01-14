// ./example/plugins/errors.ts
import type { Plugin } from "../../mod.ts";
import { bold, red } from "jsr:@std/fmt/colors";
import { HttpError } from "jsr:@oak/commons@1/http_errors";
import { Status } from "jsr:@oak/commons@1/status";
import type OakPlugin from "./oak.ts"

export default {
  name: "http_backend_errors",
  register(events) {
      events.on<[typeof OakPlugin]>("plugin:http_backend:initializing", (plugin) => {
      plugin.app.use(async (ctx, next) => {
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
    })
  },
} as Plugin;