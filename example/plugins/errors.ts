// ./plugins/errors.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { bold, red } from "jsr:@std/fmt/colors";
import app from "./oak.ts";
import { HttpError } from "jsr:@oak/commons@1/http_errors";
import { Status } from "jsr:@oak/commons@1/status";
export default {
  name: "oak_errors",
  version: "0.0.1",
  dependsOn: [
    { name: "oak" },
    { name: "oak_logging", optional: true },
  ],
  exports: undefined,
  init() {
    app.exports.use(async (oakContext, next) => {
      try {
        await next();
      } catch (e) {
        if (e instanceof HttpError) {
          oakContext.response.status = e.status;
          oakContext.response.body = e.expose
            ? `${e.status} - ${e.message}`
            : `${e.status} - ${Status[e.status]}`;
        } else {
          oakContext.response.status = 500;
          oakContext.response.body = "500 - Internal Server Error";
        }
        console.error(red(bold("Error: ")), e);
      }
    });
  },
} satisfies Plugin;