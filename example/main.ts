// ./main.ts
import Loader, { type Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { walk } from "jsr:@std/fs/walk";

const plugins: Plugin[] = [];
for await (const path of walk("./plugins")) {
  path.isFile && plugins.push((await import(`./${path.path}`)).default);
}

await new Loader({ server: "localhost:8080" }, plugins).start();