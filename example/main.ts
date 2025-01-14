// ./example/main.ts
import { Registry, type Plugin } from "../mod.ts";
import { walk } from "jsr:@std/fs/walk";

const plugins: Plugin[] = [];
for await (const path of walk("./plugins")) {
  path.isFile && plugins.push((await import(`./${path.path}`)).default);
}

new Registry(plugins)